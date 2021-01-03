import "reflect-metadata";
import { Cli } from "./cli";

export * from "./cli";
export * from "./command";
export * from "./context";
export * from "./logger";
export * from "./types";

export const cli = new Cli();
