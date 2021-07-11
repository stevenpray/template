import convict from "convict";
import validator from "convict-format-with-validator";
import { cosmiconfig } from "cosmiconfig";
import fs from "fs/promises";
import { defaultsDeep, isObject } from "lodash";
import path from "path";

import type Convict from "convict";
import type { PartialDeep, ReadonlyDeep } from "type-fest";
import type { Context } from "./context";

export type ConfigValue = string | number | boolean | null | undefined;

export type ConfigParams = NodeJS.Dict<ConfigValue | ConfigValue[] | ConfigParams>;

export type ConfigSchema<T> = Convict.Schema<T>;

export class Config<T extends ConfigParams> {
  protected readonly config: Convict.Config<T>;
  protected readonly context: Context;

  constructor(context: Context, schema: Convict.Schema<T>) {
    this.context = context;

    convict.addFormats(validator);
    this.config = convict(schema);
  }

  async load(options?: Partial<T>) {
    const explorer = cosmiconfig(this.context.pkg.name);
    const result = await explorer.search();
    if (result?.config) {
      this.config.load(result.config);
    }
    const filepath = path.join(this.context.dir.config, "config.json");
    try {
      const stats = await fs.stat(filepath);
      if (stats.isFile()) {
        this.config.loadFile(filepath);
      }
    } catch {}
    if (options) {
      this.config.load(options);
    }
    this.config.validate({ allowed: "strict" });
    const props = this.config.getProperties();
    return Config.freeze(props);
  }

  static defaults<O extends PartialDeep<D>, D extends ConfigParams>(options?: O, defaults?: D) {
    const params = defaultsDeep(options, defaults) as O & D;
    return Config.freeze(params);
  }

  static freeze<T>(object: T) {
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
