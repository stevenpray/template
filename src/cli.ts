import cluster from "cluster";
import minimist from "minimist";
import { constants } from "os";
import ptimeout from "p-timeout";
import { final } from "pino";
import { Config } from "./config";
import { Context } from "./context";
import { DefaultCommand } from "./default/default.command";
import { Logger } from "./logger";

import type Pino from "pino";
import type { ReadonlyDeep } from "type-fest";
import type { CommandClass, CommandInterface, CommandOptions } from "./command";
import type { LoggerInterface, LogLevel } from "./logger";
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

  private command?: CommandInterface;
  private exiting = false;
  private logger: LoggerInterface;

  constructor(commands?: CliCommandMap, options?: CliOptions) {
    this.commands = commands;
    this.config = Config.defaults(options, Cli.defaults);
    this.context = new Context();
    this.logger = Logger.create(this.context.env);
  }

  async exec(argv: Readonly<string[]> = process.argv) {
    process.title = this.context.pkg.name;
    this.listen();

    const [, , ...args] = argv;
    const { _, ...options } = minimist(args);
    const name = _[0];
    const { debug } = options as CommandOptions;

    // Configure logging level if debug is enabled.
    if (debug) {
      const level = this.logger.levels.values[this.logger.level]!;
      const levels = this.logger.levels;
      if (level > levels.values["trace"]!) {
        this.logger.level = levels.labels[level - 10] as LogLevel;
      }
    }

    if (name == null) {
      this.command = new DefaultCommand(this.context, this.logger, options);
    } else {
      const CommandCtor = this.commands?.get(name);
      if (CommandCtor == null) {
        throw new Error("command not found");
      }

      // Configure process title and logger name.
      const title = [name, cluster.isWorker && "worker"].filter(Boolean).join("/");
      process.title = [process.title, title].join("/");
      this.logger = this.logger.child({ name: title });

      this.command = new CommandCtor(this.context, this.logger, options as CommandOptions);
    }

    if (this.context.env === "development") {
      this.logger.debug("executing in development environment (options: %o)", options);
    } else if (debug) {
      this.logger.warn("executing with debug enabled");
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
      const logger = this.logger as Pino.Logger;
      final(logger).error(error);
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
      const logger = this.logger as Pino.Logger;
      final(logger).trace("process exit (code: %d, graceful: %s)", code, this.exiting);
    });
  }
}
