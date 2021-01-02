import "reflect-metadata";
import { Cli } from "./cli";

export * from "./cli";
export * from "./command";

export const cli = new Cli();
