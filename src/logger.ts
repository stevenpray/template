import pino, { destination, levels } from "pino";

import type Pino from "pino";
import type { Context } from "./context";
import type { FactoryInterface } from "./factory";

export type LogLevel = Pino.Level;

export type LogLevelWithSilent = Pino.LevelWithSilent;

export interface LoggerChildOptions {
  level?: LogLevelWithSilent;
  name?: string;
}

export interface LoggerOptions extends LoggerChildOptions {
  pretty?: boolean;
}

export interface LoggerInterface extends Record<LogLevel, Pino.LogFn> {
  child: (options?: LoggerChildOptions) => LoggerInterface;
  level?: LogLevelWithSilent;
}

export class Logger implements FactoryInterface<LoggerInterface> {
  static readonly levels = Object.freeze(Object.values(levels.labels) as LogLevelWithSilent[]);

  constructor(private readonly context: Context) {}

  create(options?: LoggerOptions) {
    return pino(
      {
        level: options?.level ?? "info",
        transport: {
          options: {
            ignore: this.context.env.isDevelopment ? "hostname" : undefined,
            translateTime: this.context.env.isDevelopment && "HH:MM:ss.l",
          },
          target: "pino-pretty",
        },
      },
      destination({ sync: true }),
    ) as LoggerInterface;
  }
}
