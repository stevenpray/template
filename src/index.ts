import "reflect-metadata";

import { Cli } from "./cli";

import type { CommandClass } from "./command";

const commands = new Map<string, CommandClass>();

export const cli = () => new Cli(commands).exec();
