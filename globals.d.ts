declare namespace NodeJS {
  interface Process {
    argv: string[] & [string, string];
  }

  interface ProcessEnv extends Dict<string> {
    DEBUG?: string;
    NODE_ENV?: "ci" | "development" | "production" | "test";
    TZ?: string;

    APPDATA?: string;
    LOCALAPPDATA?: string;

    XDG_CACHE_HOME?: string;
    XDG_CONFIG_DIRS?: string;
    XDG_CONFIG_HOME?: string;
    XDG_DATA_DIRS?: string;
    XDG_DATA_HOME?: string;
    XDG_RUNTIME_DIR?: string;
    XDG_STATE_HOME?: string;
  }
}

// https://github.com/microsoft/TypeScript/issues/44253
declare interface ObjectConstructor {
  hasOwn: <ObjectType extends Record, Key extends PropertyKey>(
    object: ObjectType,
    key: Key,
  ) => object is ObjectType & Record<Key, unknown>;
}
