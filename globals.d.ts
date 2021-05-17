declare type Signal = NodeJS.Signals;

declare namespace NodeJS {
  interface ProcessEnv {
    DEBUG?: string;
    NODE_ENV?: "development" | "production" | "test";
    XDG_RUNTIME_DIR?: string;
  }
}
