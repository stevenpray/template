import { defaultsDeep } from "lodash";
import mri from "mri";
import { constants } from "os";
import ptimeout from "p-timeout";
import pino, { destination } from "pino";
import { Context } from "./context";

import type Pino from "pino";
import type { Command, CommandClass, CommandOptions } from "./command";
import type { Logger } from "./logger";
import type { Nullable } from "./types";

interface CliDefaults {
  exit: {
    signals: Signal[];
    timeout: number;
  };
}

export interface CliOptions extends Partial<CliDefaults> {
  logger?: Logger;
}

type CliConfig = CliOptions & CliDefaults;

type CliCommandMap = ReadonlyMap<string, CommandClass>;

export class Cli {
  private static readonly defaults: Readonly<CliDefaults> = {
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGTERM", "SIGUSR2"],
      timeout: 10_000,
    },
  };

  private readonly commands?: CliCommandMap;
  private readonly config: Readonly<CliConfig>;
  private readonly context: Context;
  private readonly logger: Logger;

  private command?: Command;
  private exiting = false;

  constructor(commands?: CliCommandMap, options?: CliOptions) {
    this.commands = commands;
    this.config = defaultsDeep(options, Cli.defaults) as CliConfig;
    this.context = new Context();
    this.logger = pino(
      {
        prettyPrint: this.context.env === "development" && {
          ignore: "hostname,name",
          messageFormat: "{name}: {msg}",
          translateTime: "HH:MM:ss.l",
          suppressFlushSyncWarning: true,
        },
      },
      destination({ sync: false }),
    ) as Logger;
  }

  async run(argv: Readonly<string[]> = process.argv) {
    this.listen();
    const { name, options } = this.parse(argv);

    this.logger.level =
      this.context.env === "development"
        ? options.debug
          ? "trace"
          : "debug"
        : options.debug
        ? "debug"
        : "info";

    if (this.context.env === "development") {
      this.logger.debug("executing in development environment (debug: %s)", options.debug);
    } else if (options.debug) {
      this.logger.warn("executing with debug enabled");
    }

    if (name != null) {
      const commandClass = this.commands?.get(name);
      if (commandClass) {
        this.command = new commandClass(this.context, this.logger.child({ name }));
      }
    }

    return this.command?.run(options);
  }

  private async exit(code = 0, signal: Nullable<Signal> = null) {
    if (this.exiting) {
      return;
    }
    this.exiting = true;

    try {
      // Attempt to exit gracefully.
      const exit = this.command?.exit(code, signal);
      if (exit instanceof Promise) {
        await ptimeout(exit, this.config.exit.timeout, "graceful exit timed-out");
      }
      process.nextTick(process.exit.bind(process, code));
    } catch (error) {
      // Graceful exit failed with error.
      pino.final(this.logger as Pino.Logger).error(error);
      process.kill(process.pid, "SIGKILL");
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

    // Graceful exit on stdin EOF.
    process.stdin.once("end", () => {
      void this.exit();
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
      pino
        .final(this.logger as Pino.Logger)
        .trace("process exit (code: %d, graceful: %s)", code, this.exiting);
    });
  }

  private parse(argv: Readonly<string[]>) {
    const [, , ...args] = argv;
    const { _, ...options } = mri(args, { boolean: "debug", default: { debug: false } });
    const [name] = _;

    return { name, options } as { name?: string; options: CommandOptions };
  }
}
