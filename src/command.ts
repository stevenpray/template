import cluster from "cluster";
import execa from "execa";
import { defaults } from "lodash";

import type { ChildProcess } from "child_process";
import type Execa from "execa";
import type { ConfigParams } from "./config";
import type { Context } from "./context";
import type { LoggerInterface } from "./logger";
import type { MaybePromise } from "./types";

export interface CommandForkOptions {
  env?: NodeJS.Dict<any> | null;
  retry?: {
    attempts?: number;
    interval?: number;
  };
}

export interface CommandDefaults extends ConfigParams {
  debug: boolean;
}

export type CommandOptions = Partial<CommandDefaults>;

export interface CommandClass<O extends CommandOptions = CommandOptions> {
  new (context: Context, logger: LoggerInterface, options: O): CommandInterface;
}

export interface CommandInterface {
  exec: () => MaybePromise<void>;
  exit?: (code: number, signal: NodeJS.Signals | null) => MaybePromise<void>;
}

export abstract class Command<C extends CommandOptions = CommandOptions>
  implements CommandInterface
{
  protected readonly context: Context;
  protected readonly logger: LoggerInterface;
  protected readonly config: C;

  constructor(context: Context, logger: LoggerInterface, config: C) {
    this.context = context;
    this.logger = logger;
    this.config = config;
  }

  abstract exec(): MaybePromise<void>;

  protected spawn(command: string, args?: string[], options?: Execa.Options) {
    const config = defaults(options, { stdio: [process.stdin, process.stdout, process.stderr] });
    const child: ChildProcess = execa(command, args, config);
    this.logger.debug("child spawned (pid: %d, %o)", child.pid, { command, args, options });
    child.on("error", (error) => this.logger.error(error));
    child.on("exit", (code, signal) => {
      this.logger.debug("child exited (pid: %d, %o)", child.pid, { code, signal });
    });
    return child;
  }

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
}
