import "reflect-metadata";

import { Cli } from "./cli";

export const cli = new Cli();

export * from "./cli";
export * from "./command";
export * from "./context";
export * from "./logger";
export * from "./types";
