import root from "app-root-path";
import { isError, omit } from "lodash";
import cluster from "node:cluster";
import { constants } from "node:os";
import { basename } from "node:path";
import ptimeout from "p-timeout";
import parser from "yargs-parser";
import { Config } from "./config";
import { Context } from "./context";
import { DefaultCommand } from "./default/default.command";
import { Logger } from "./logger";

import type { ReadonlyDeep } from "type-fest";
import type { CommandClass, CommandInterface } from "./command";
import type { ConfigParams } from "./config";
import type { LoggerInterface } from "./logger";

export enum CliProcessMessage {
  // PM2 graceful start with `wait-ready`.
  Ready = "ready",
  // PM2 graceful stop with `shutdown_with_message`.
  Shutdown = "shutdown",
}

export interface CliDefaults extends ConfigParams {
  exit: { signals: NodeJS.Signals[]; timeout: number };
}

export class Cli {
  private static readonly defaults: ReadonlyDeep<CliDefaults> = {
    exit: {
      signals: ["SIGBREAK", "SIGHUP", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR2"],
      timeout: 10_000,
    },
  };

  private readonly context: Context;

  private command?: CommandInterface;
  private exited = false;
  private logger: LoggerInterface;

  constructor(private readonly commands?: ReadonlyMap<string, CommandClass>) {
    this.context = new Context();
    this.logger = new Logger(this.context).create();
  }

  async exec(argv = process.argv) {
    // Listen for process events.
    this.configureProcessListeners();
    // Configure process stdin.
    this.configureProcessStdin();
    // Set the process title from the package.json bin entry if it exists.
    this.configureProcessTitle(argv);

    const { args, opts } = this.parse(argv);
    const name = args.shift();
    const Command = this.find(name as string);
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
    if (this.exited) {
      return;
    }
    this.exited = true;
    this.logger.trace({ code, signal }, "process will exit");
    try {
      // Attempt to exit gracefully.
      const exit = this.command?.exit?.(code, signal ?? null);
      if (exit instanceof Promise) {
        await ptimeout(exit, Cli.defaults.exit.timeout, "process exit timed-out");
      }
      process.nextTick(process.exit.bind(process, code));
    } catch (error) {
      // Graceful exit failed with error.
      this.logger.error(error);
      process.nextTick(process.kill.bind(process, process.pid, "SIGKILL"));
    }
  }

  private configureProcessListeners() {
    // Handle exit on Windows and PM2 `shutdown_with_message`.
    process.on("message", (message) => {
      this.logger.debug("process received message %o", message);
      if (message === CliProcessMessage.Shutdown) {
        void this.exit();
      }
    });
    // Handle warning and deprecation messages.
    process.on("warning", (warning) => {
      if (!isError(warning) || !warning.message.toLowerCase().startsWith("invalid 'main' field")) {
        this.logger.warn(warning);
      }
    });
    // Throw uncaught exception on unhandled rejection.
    process.once("unhandledRejection", (reason) => {
      throw reason;
    });
    // Log uncaught exceptions and unhandled rejections.
    process.on("uncaughtExceptionMonitor", (error) => {
      if (error instanceof AggregateError) {
        const errors = error.errors.map((e) => (isError(e) ? e.message : (e as string)));
        this.logger.fatal(error.message, errors);
      } else {
        this.logger.fatal(error);
      }
    });
    // Handle exit on exception.
    process.once("uncaughtException", () => {
      void this.exit(1);
    });
    // Handle exit on empty event loop.
    process.once("beforeExit", (code) => {
      void this.exit(code);
    });
    // Trace process exit.
    process.once("exit", (code) => {
      const info = { code, graceful: this.exited };
      this.logger.debug(info, "process exit");
    });
    // Handle exit on POSIX signals.
    for (const signal of Cli.defaults.exit.signals) {
      process.on(signal, () => {
        this.logger.debug("process received signal: %s", signal);
        const code = 128 + constants.signals[signal];
        void this.exit(code, signal);
      });
    }
  }

  private configureProcessStdin(stdin = process.stdin) {
    if (!stdin.isTTY) {
      return;
    }
    // Disable built-in processing of control sequences.
    stdin.setRawMode(true);
    // Decode stdin data buffer to UTF-8 string.
    stdin.setEncoding("utf8");
    // Listen to input on TTY stdin for custom handling of control sequences.
    stdin.on("data", (data: string) => {
      switch (data) {
        // Re-implement process interrupt on ⌃c.
        case "\u0003":
          return process.emit("SIGINT", "SIGINT");
        // End stdin stream on ⌃d.
        case "\u0004":
          return stdin.emit("end");
      }
    });
    // Allow the program to exit when stdin is the only active socket.
    stdin.unref();
    // Handle stdin EOF.
    stdin.on("end", () => {
      void this.exit();
    });
  }

  private configureProcessTitle(argv = process.argv) {
    const script = argv.at(1);
    if (script && this.context.pkg.bin) {
      const records = Object.entries(this.context.pkg.bin);
      const record = records.find(([name, path]) => {
        const filename = basename(script);
        const resolved = require.resolve(root.resolve(path));
        return script === resolved || filename === name;
      });
      if (record) {
        // Replace node exec path and args with `bin` record from package.json.
        let title = [record.at(0), ...argv.slice(2)].join(" ");
        if (cluster.isWorker) {
          title += "/worker";
        }
        // Set the process title using the `bin` record from package.json if it exists.
        process.title = title;
      }
    }
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
