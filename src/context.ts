import root from "app-root-path";
import paths from "env-paths";
import * as stdenv from "std-env";

import type { Paths } from "env-paths";
import type { PackageJson, SetRequired } from "type-fest";

type Dir = Paths & { run?: string };
type Pkg = SetRequired<PackageJson, "name" | "version">;

export class Context {
  readonly dir: Dir;
  readonly env = stdenv;
  readonly pkg = root.require("package.json") as Pkg;

  constructor() {
    // eslint-disable-next-line node/no-process-env
    this.dir = { ...paths(this.pkg.name, { suffix: "" }), run: process.env.XDG_RUNTIME_DIR };
  }
}
