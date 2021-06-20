import root from "app-root-path";
import paths from "env-paths";

import type { Paths } from "env-paths";
import type { PackageJson, SetRequired } from "type-fest";

type Dir = Paths & { run?: string };
type Env = NonNullable<NodeJS.ProcessEnv["NODE_ENV"]>;
type Pkg = SetRequired<PackageJson, "name" | "version">;

export class Context {
  readonly dir: Dir;
  readonly env: Env;
  readonly pkg: Pkg;

  constructor() {
    // eslint-disable-next-line node/no-process-env,@typescript-eslint/prefer-nullish-coalescing
    this.env = process.env.NODE_ENV || "development";

    this.pkg = root.require("package.json") as Pkg;

    // eslint-disable-next-line node/no-process-env
    this.dir = { ...paths(this.pkg.name, { suffix: "" }), run: process.env.XDG_RUNTIME_DIR };
  }
}
