import { constants } from "os";
import { defaultsDeep } from "lodash";
import minimist from "minimist";
import ptimeout from "p-timeout";
import type Pino from "pino";
import pino from "pino";
import type { Class, SetOptional } from "type-fest";
import type { Logger } from "./logger";
import type { Nullable, MaybePromise } from "./types";

export interface CliCommandOptions {
  [name: string]: CliCommandOptions | boolean | number | string;
}

export interface CliCommand {
  run: () => MaybePromise<void>;
  exit?: (code: number, signal: NodeJS.Signals | null) => MaybePromise<void>;
}

export type CliCommandClass = Class<CliCommand, [CliCommandOptions | undefined]>;

interface CliDefaults {
  commands: ReadonlyMap<Nullable<string>, CliCommandClass>;
  exit: {
    signals: NodeJS.Signals[];
    timeout: number;
  };
}

export type CliOptions = SetOptional<CliDefaults>;

export class Cli {
  private static readonly defaults: Readonly<CliDefaults> = {
    commands: new Map<Nullable<string>, CliCommandClass>(),
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGTERM", "SIGUSR2"],
      timeout: 10000,
    },
  };

  private readonly config: Readonly<CliOptions & CliDefaults>;
  private readonly logger: Logger;
  private exiting: boolean;
  private command?: CliCommand;

  constructor(options?: CliOptions) {
    this.config = defaultsDeep(options, Cli.defaults) as CliOptions & CliDefaults;
    this.logger = pino() as Logger;
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
        const code = 128 + constants.signals[signal];
        void this.exit(code, signal);
      }),
    );

    // Graceful exit on Windows and PM2 "shutdown_with_message".
    process.on("message", (message) => {
      if (message === "shutdown") {
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
        .trace("exit (code: %d, graceful: %s)", code, this.exiting);
    });

    // Parse command `name` and `options` from argv.
    const [, , ...args] = argv;
    const { _, ...options } = minimist(args);
    const [name] = _;

    // Find command by name.
    const CommandClass = this.config.commands.get(name);
    if (CommandClass) {
      this.command = new CommandClass(options);
    }

    await this.command?.run();
  }

  private async exit(code = 0, signal: Nullable<NodeJS.Signals> = null) {
    if (this.exiting) {
      return;
    }
    this.exiting = true;
    try {
      // Attempt to exit gracefully if the command defines an exit function.
      const exit = this.command?.exit?.(code, signal);
      if (exit instanceof Promise) {
        await ptimeout(exit, this.config.exit.timeout);
      }
      process.nextTick(process.exit.bind(process, code));
    } catch (error) {
      // Graceful exit failed with error.
      this.logger.error(error);
      process.nextTick(process.kill.bind(process, process.pid, "SIGKILL"));
    }
  }
}
