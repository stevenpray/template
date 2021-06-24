import { defaultsDeep, isObject } from "lodash";

import type { JsonValue, ReadonlyDeep } from "type-fest";

export type ConfigParams = NodeJS.Dict<JsonValue>;

export class Config<O extends ConfigParams, D extends ConfigParams> {
  readonly params: ReadonlyDeep<O & D>;

  constructor(options?: O, defaults?: D) {
    this.params = Config.defaults(options, defaults);
  }

  all() {
    return this.params;
  }

  get<Key extends keyof ReadonlyDeep<O & D>>(key: Key, value?: Required<ReadonlyDeep<O & D>>[Key]) {
    return this.params[key] === undefined ? Config.freeze(value) : this.params[key];
  }

  static defaults<O extends ConfigParams, D extends ConfigParams>(o?: O, d?: D) {
    const params = defaultsDeep(o, d) as O & D;
    return Config.freeze(params);
  }

  private static freeze<T>(object: T) {
    if (isObject(object)) {
      for (const value of Object.values(object)) {
        if (isObject(value)) {
          Config.freeze(value);
        }
      }
    }
    return Object.freeze(object) as ReadonlyDeep<T>;
  }
}
