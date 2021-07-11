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
    const level = options?.level ?? "info";
    const stream = destination({ sync: options?.pretty });
    return pino(
      {
        level,
        prettyPrint: options?.pretty && {
          ignore: this.context.env.dev ? "hostname" : undefined,
          translateTime: this.context.env.dev && "HH:MM:ss.l",
          suppressFlushSyncWarning: this.context.env.dev,
        },
      },
      stream,
    ) as LoggerInterface;
  }
}
