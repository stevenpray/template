import { constants } from "os";
import { defaultsDeep } from "lodash";
import minimist from "minimist";
import ptimeout from "p-timeout";
import type Pino from "pino";
import pino, { destination } from "pino";
import type { SetOptional } from "type-fest";
import type { Command, CommandClass } from "./command";
import { Context } from "./context";
import type { Logger } from "./logger";
import type { Nullable } from "./types";

type Signal = NodeJS.Signals;

export interface CliArgs {
  debug: boolean;
  [name: string]: any;
}

interface CliDefaults {
  commands: ReadonlyMap<Nullable<string>, CommandClass>;
  exit: {
    signals: Signal[];
    timeout: number;
  };
}

export interface CliOptions extends SetOptional<CliDefaults> {
  logger?: Logger;
}

type CliConfig = CliOptions & CliDefaults;

export class Cli {
  private static readonly defaults: Readonly<CliDefaults> = {
    commands: new Map<Nullable<string>, CommandClass>(),
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGTERM", "SIGUSR2"],
      timeout: 10000,
    },
  };

  private readonly config: Readonly<CliConfig>;
  private readonly logger: Logger;
  private readonly context: Context;

  private exiting: boolean;
  private command?: Command;

  constructor(options?: CliOptions) {
    this.config = defaultsDeep(options, Cli.defaults) as CliConfig;
    this.context = new Context();
    this.logger =
      options?.logger ??
      (pino(
        { prettyPrint: this.context.env === "development" && { suppressFlushSyncWarning: true } },
        destination({ sync: true }),
      ) as Logger);

    this.exiting = false;
  }

  async run(argv: Readonly<string[]> = process.argv) {
    // Handle warnings and deprecation messages.
    process.on("warning", (warning) => {
      this.logger.warn(warning);
    });

    // Raise uncaught exception on unhandled promise rejection.
    process.on("unhandledRejection", (reason) => {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw reason;
    });

    // Graceful exit on POSIX signals.
    this.config.exit.signals.forEach((signal) =>
      process.once(signal, () => {
        this.logger.trace("process received signal: %s", signal);
        const code = 128 + constants.signals[signal];
        void this.exit(code, signal);
      }),
    );

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

    // Parse command `name` and `options` from argv.
    const [, , ...args] = argv;
    const { _, ...options } = minimist<CliArgs>(args, { boolean: "debug" });
    const [name] = _;

    this.logger.level =
      this.context.env === "development"
        ? options.debug
          ? "trace"
          : "debug"
        : options.debug
        ? "debug"
        : "info";

    if (name) {
      const commandClass = this.config.commands.get(name);
      if (commandClass) {
        this.command = new commandClass(this.context, this.logger);
      }
    }

    await this.command?.run(options);
  }

  private async exit(code = 0, signal: Nullable<Signal> = null) {
    if (this.exiting) {
      return;
    }
    this.exiting = true;

    try {
      // Attempt to exit gracefully if the command defines an exit function.
      const exit = this.command?.exit(code, signal);
      if (exit instanceof Promise) {
        await ptimeout(exit, this.config.exit.timeout);
      }
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(code);
    } catch (error) {
      // Graceful exit failed with error.
      pino.final(this.logger as Pino.Logger).error(error);
      process.kill(process.pid, "SIGKILL");
    }
  }
}
