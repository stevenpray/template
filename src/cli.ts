import { defaultsDeep } from "lodash";
import mri from "mri";
import { constants } from "os";
import ptimeout from "p-timeout";
import pino, { destination, final } from "pino";
import { Context } from "./context";
import { DefaultCommand } from "./default/default.command";

import type Pino from "pino";
import type { ReadonlyDeep } from "type-fest";
import type { CommandClass, CommandInterface, CommandOptions } from "./command";
import type { Logger } from "./logger";
import type { Nullable } from "./types";

export interface CliDefaults {
  exit: {
    signals: NodeJS.Signals[];
    timeout: number;
  };
}

export type CliOptions = Partial<CliDefaults>;

export type CliConfig = CliOptions & CliDefaults;

export type CliCommandMap = ReadonlyMap<string, CommandClass>;

export class Cli {
  private static readonly defaults: Readonly<CliDefaults> = {
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGTERM", "SIGUSR2"],
      timeout: 10_000,
    },
  };

  private readonly commands?: CliCommandMap;
  private readonly config: ReadonlyDeep<CliConfig>;
  private readonly context: Context;
  private readonly logger: Logger;

  private command?: CommandInterface;
  private exiting = false;

  constructor(commands?: CliCommandMap, options?: CliOptions) {
    this.commands = commands;
    this.config = defaultsDeep(options, Cli.defaults) as CliConfig;
    this.context = new Context();

    this.logger = pino(
      {
        prettyPrint: this.context.env === "development" && {
          ignore: "hostname",
          translateTime: "HH:MM:ss.l",
          suppressFlushSyncWarning: true,
        },
      },
      destination({ sync: true }),
    ) as Logger;
  }

  async exec(argv: Readonly<string[]> = process.argv) {
    this.listen();

    const [, , ...args] = argv;
    const { _, ...options } = mri(args, { boolean: "debug", default: { debug: false } });
    const name = _[0];
    const { debug } = options as CommandOptions;

    this.logger.level =
      this.context.env === "development" ? (debug ? "trace" : "debug") : debug ? "debug" : "info";

    if (this.context.env === "development") {
      this.logger.debug("executing in development environment (debug: %s)", debug);
    } else if (debug) {
      this.logger.warn("executing with debug enabled");
    }

    if (name == null) {
      this.command = new DefaultCommand(this.context, this.logger, options);
    } else {
      const CommandCtor = this.commands?.get(name);
      if (CommandCtor == null) {
        throw new Error("command not found");
      }
      const logger = this.logger.child({ name });
      this.command = new CommandCtor(this.context, logger, options as CommandOptions);
    }
    await this.command.exec();
  }

  private async exit(code = 0, signal: Nullable<NodeJS.Signals> = null) {
    if (this.exiting) {
      return;
    }
    this.exiting = true;
    try {
      // Attempt to exit gracefully.
      const exit = this.command?.exit?.(code, signal);
      if (exit instanceof Promise) {
        await ptimeout(exit, this.config.exit.timeout, "graceful exit timed-out");
      }
      process.nextTick(process.exit.bind(process, code));
    } catch (error) {
      // Graceful exit failed with error.
      final(this.logger as Pino.Logger).error(error);
      process.nextTick(process.kill.bind(process, process.pid, "SIGKILL"));
    }
  }

  private listen() {
    // Handle warning and deprecation messages.
    process.on("warning", (warning) => {
      this.logger.warn(warning);
    });
    // Raise uncaught exception on unhandled promise rejection.
    process.on("unhandledRejection", (reason) => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw reason;
    });
    // Graceful exit on stdin EOF.
    process.stdin.once("end", () => {
      void this.exit();
    });
    // Graceful exit on POSIX signals.
    for (const signal of this.config.exit.signals) {
      process.on(signal, () => {
        this.logger.trace("process received signal: %s", signal);
        const code = 128 + constants.signals[signal];
        void this.exit(code, signal);
      });
    }
    // Graceful exit on Windows and PM2 "shutdown_with_message".
    process.on("message", (message) => {
      if (message === "shutdown") {
        this.logger.trace("process received shutdown message");
        void this.exit();
      }
    });
    // Graceful exit on empty event loop.
    process.once("beforeExit", (code) => {
      void this.exit(code);
    });
    // Graceful exit on exception.
    process.once("uncaughtException", (error) => {
      this.logger.fatal(error);
      void this.exit(1);
    });
    // Trace process exit.
    process.once("exit", (code) => {
      final(this.logger as Pino.Logger).trace(
        "process exit (code: %d, graceful: %s)",
        code,
        this.exiting,
      );
    });
  }
}
