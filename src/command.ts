import root from "app-root-path";
import cluster from "cluster";
import execa from "execa";
import { defaults } from "lodash";
import unparse from "yargs-unparser";
import { Logger } from "./logger";

import type { ChildProcess } from "child_process";
import type Execa from "execa";
import type { ReadonlyDeep } from "type-fest";
import type { ConfigParams, ConfigSchema } from "./config";
import type { Context } from "./context";
import type { LoggerInterface, LogLevel } from "./logger";
import type { MaybePromise } from "./types";

export interface CommandForkOptions {
  env?: NodeJS.Dict<any> | null;
  retry?: {
    attempts?: number;
    interval?: number;
  };
}

// eslint-disable-next-line import/no-named-as-default-member
export interface CommandSpawnOptions extends Execa.Options {
  args?: string[];
}

export interface CommandConfig extends ConfigParams {
  debug: boolean;
  log: { level?: LogLevel; pretty?: boolean };
}

export interface CommandInterface {
  exec: () => MaybePromise<void>;
  exit?: (code: number, signal: NodeJS.Signals | null) => MaybePromise<void>;
}

export interface CommandClass<C = CommandConfig> {
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

  abstract exec(): MaybePromise<void>;

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
    const child: ChildProcess = execa(command, args, config);
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
