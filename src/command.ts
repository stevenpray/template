import root from "app-root-path";
import execa from "execa";
import { defaults } from "lodash";
import cluster from "node:cluster";
import unparse from "yargs-unparser";
import { Logger } from "./logger";

import type { Options as ExecaOptions } from "execa";
import type { ChildProcess } from "node:child_process";
import type { ReadonlyDeep } from "type-fest";
import type { ConfigParams, ConfigSchema } from "./config";
import type { Context } from "./context";
import type { LoggerInterface, LogLevel } from "./logger";

export interface CommandForkOptions {
  env?: NodeJS.Dict<any> | null;
  retry?: {
    attempts?: number;
    interval?: number;
  };
}

export interface CommandSpawnOptions extends ExecaOptions {
  args?: string[];
}

export interface CommandConfig extends ConfigParams {
  debug: boolean;
  log: { level?: LogLevel; pretty?: boolean };
}

export interface CommandInterface {
  exec: () => Promise<void> | void;
  exit?: (code: number, signal: NodeJS.Signals | null) => Promise<void> | void;
}

export interface CommandClass<C extends CommandConfig = CommandConfig> {
  schema: ConfigSchema<C>;
  new (context: Context, logger: LoggerInterface, config: ReadonlyDeep<C>): CommandInterface;
}

export abstract class Command<C extends CommandConfig = CommandConfig> implements CommandInterface {
  static readonly schema: ConfigSchema<CommandConfig> = {
    debug: {
      arg: "debug",
      default: false,
      format: Boolean,
    },
    log: {
      level: {
        arg: "log.level",
        default: undefined,
        format: Logger.levels,
      },
      pretty: {
        arg: "log.pretty",
        default: undefined,
        format: Boolean,
      },
    },
  };

  constructor(
    protected readonly context: Context,
    protected readonly logger: LoggerInterface,
    protected readonly config: ReadonlyDeep<C>,
  ) {}

  abstract exec(): Promise<void> | void;

  protected fork(options?: CommandForkOptions) {
    const config = defaults(options, { env: null, retry: { attempts: 0, interval: 0 } });
    const worker = cluster.fork(config.env);
    const child = worker.process;
    this.logger.debug("worker %d forked (pid: %d, %o)", worker.id, child.pid, config);
    worker.on("error", (error) => this.logger.error(error));
    worker.on("exit", (code, signal) => {
      this.logger.debug("worker %d exited (pid: %d, %o)", worker.id, child.pid, { code, signal });
      if (code === 1 && config.retry.attempts > 0) {
        config.retry.attempts -= 1;
        setTimeout(this.fork.bind(this, config), config.retry.interval);
      }
    });
    return worker;
  }

  protected spawn(command: string, options?: CommandSpawnOptions) {
    const stdio = [process.stdin, process.stdout, process.stderr];
    const { args, ...config } = defaults(options, { stdio });
    const child = execa(command, args, config) as ChildProcess;
    this.logger.debug("child spawned (pid: %d, %o)", child.pid, { command, args, options });
    child.on("error", (error) => this.logger.error(error));
    child.on("exit", (code, signal) => {
      this.logger.debug("child exited (pid: %d, %o)", child.pid, { code, signal });
    });
    return child;
  }

  protected spawnc(name: string, config?: ConfigParams, options?: CommandSpawnOptions) {
    const command = root.resolve("bin");
    const args = unparse({ ...config, _: [name] });
    return this.spawn(command, { args, ...options });
  }
}
