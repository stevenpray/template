import "reflect-metadata";
import { Cli } from "./cli";

import type { CommandClass } from "./command";
import type { Nullable } from "./types";

export * from "./cli";
export * from "./command";
export * from "./context";
export * from "./logger";
export * from "./types";

const commands = new Map<Nullable<string>, CommandClass>();

export const cli = new Cli({ commands });
