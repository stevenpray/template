import type { CliCommand, CliCommandOptions } from "./cli";
import type { MaybePromise } from "./types";

export type CommandOptions = CliCommandOptions;

export abstract class Command implements CliCommand {
  protected readonly options?: Readonly<CommandOptions>;

  constructor(options?: CommandOptions) {
    this.options = options;
  }

  abstract run(): MaybePromise<void>;
}
