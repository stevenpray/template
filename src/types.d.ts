declare type Maybe<T> = T | null | undefined;

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test" | undefined;
  }
}
