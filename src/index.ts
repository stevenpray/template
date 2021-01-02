import "reflect-metadata";
import type { CommandClass } from "./command";
import { Cli } from "./cli";

export * from "./cli";
export * from "./command";

export const cli = new Cli();
