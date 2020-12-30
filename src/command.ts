import type { Maybe, MaybePromise } from "./types";

export interface CommandOptions {
  [key: string]: CommandOptions | boolean | number | string;
}

export interface Command {
  run: () => MaybePromise<void>;
  exit?: (code: number, signal: Maybe<NodeJS.Signals>) => MaybePromise<void>;
}
