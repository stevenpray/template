import pino, { destination } from "pino";

import type Pino from "pino";

interface Log {
  // eslint-disable-next-line @typescript-eslint/ban-types
  <T extends object>(object: T, message?: string, ...args: any[]): void;
  (message: string, ...args: any[]): void;
}

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type LogLevelWithSilent = LogLevel | "silent";

export interface LoggerInterface extends Record<LogLevelWithSilent, Log> {
  child: (options: { level?: LogLevel; name: string }) => LoggerInterface;
  level: LogLevelWithSilent;
  levels: Pino.LevelMapping;
}

export const Logger = {
  create(env?: typeof process.env.NODE_ENV) {
    const dev = env === "development";
    const options = {
      level: dev ? "debug" : "info",
      prettyPrint: dev && {
        ignore: "hostname",
        translateTime: "HH:MM:ss.l",
        suppressFlushSyncWarning: true,
      },
    };
    const stream = destination({ sync: dev });
    return pino(options, stream) as LoggerInterface;
  },
};
