export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
export type LogLevelWithSilent = LogLevel | "silent";

interface ChildOptions {
  level?: LogLevel;
  name: string;
}

type LogFns = {
  [key in LogLevelWithSilent]: (...args: any[]) => void;
};

export interface Logger extends LogFns {
  child: (options: ChildOptions) => Logger;
  level: LogLevelWithSilent;
}
