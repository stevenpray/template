import cluster from "cluster";
import { omit } from "lodash";
import { constants } from "os";
import ptimeout from "p-timeout";
import { final } from "pino";
import parser from "yargs-parser";
import { Config } from "./config";
import { Context } from "./context";
import { DefaultCommand } from "./default/default.command";
import { Logger } from "./logger";

import type Pino from "pino";
import type { ReadonlyDeep } from "type-fest";
import type { CommandClass, CommandInterface } from "./command";
import type { ConfigParams } from "./config";
import type { LoggerInterface } from "./logger";

export interface CliDefaults extends ConfigParams {
  exit: { signals: NodeJS.Signals[]; timeout: number };
}

export class Cli {
  private static readonly defaults: ReadonlyDeep<CliDefaults> = {
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGTERM", "SIGUSR2"],
      timeout: 10_000,
    },
  };

  private readonly context: Context;

  private command?: CommandInterface;
  private exiting = false;
  private logger: LoggerInterface;

  constructor(private readonly commands?: ReadonlyMap<string, CommandClass>) {
    this.context = new Context();
    this.logger = new Logger(this.context).create();
  }

  async exec(argv: Readonly<string[]> = process.argv) {
    process.title = this.context.pkg.name;
    this.listen();
    const { args, opts } = this.parse(argv);
    const name = args.shift();
    const Command = this.find(name);
    const title = [name, cluster.isWorker && "worker"].filter(Boolean).join("/");
    process.title = [process.title, title].join("/");
    const config = await new Config(this.context, Command.schema).load(opts);
    const level = config.log.level ?? (config.debug ? "debug" : "info");
    this.logger = new Logger(this.context).create({ ...config.log, level, name: title });
    this.logger.debug("executing %s in development environment (%o)", title, config);

    this.command = new Command(this.context, this.logger, config);
    await this.command.exec();
  }

  async exit(code = 0, signal?: NodeJS.Signals) {
    if (this.exiting) {
      return;
    }
    this.exiting = true;
    try {
      // Attempt to exit gracefully.
      const exit = this.command?.exit?.(code, signal ?? null);
      if (exit instanceof Promise) {
        await ptimeout(exit, Cli.defaults.exit.timeout, "graceful exit timed-out");
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
    for (const signal of Cli.defaults.exit.signals) {
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
      const info = { code, duration: process.uptime(), graceful: this.exiting };
      const logger = this.logger as Pino.Logger;
      final(logger).trace("process exit %o", info);
    });
  }

  private parse(argv: Readonly<string[]>) {
    const { _: args, ...options } = parser(argv.slice(2), {
      configuration: { "strip-aliased": true, "strip-dashed": true },
    });
    return { args, opts: omit(options, "$0") };
  }

  private find(name?: string) {
    const Command = name == null ? DefaultCommand : this.commands?.get(name);
    if (Command == null) {
      throw new Error("command not found");
    }
    return Command;
  }
}
