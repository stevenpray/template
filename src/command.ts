import type { CliArgs } from "./cli";
import type { Context } from "./context";
import type { Logger } from "./logger";
import type { MaybePromise } from "./types";

type Signal = NodeJS.Signals;

export type CommandOptions = CliArgs;

export interface CommandClass {
  new (context: Context, logger: Logger): Command;
}

export abstract class Command {
  protected readonly context: Context;
  protected readonly logger: Logger;

  constructor(context: Context, logger: Logger) {
    this.context = context;
    this.logger = logger;
  }

  abstract run(options?: CommandOptions): MaybePromise<void>;

  // Define the method signature for optional use by child classes.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exit(code: number, signal: Signal | null): MaybePromise<void> {
    return undefined;
  }
}
