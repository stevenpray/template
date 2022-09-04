import root from "app-root-path";
import paths from "env-paths";
import normalize from "normalize-package-data";
import * as stdenv from "std-env";

import type { Paths } from "env-paths";
import type { Package } from "normalize-package-data";
import type { PackageJson, ReadonlyDeep } from "type-fest";

type Dir = Paths & { run?: string };

export class Context {
  readonly dir: ReadonlyDeep<Dir>;
  readonly env = stdenv;
  readonly pkg: ReadonlyDeep<Package>;

  constructor() {
    const pkg = root.require("package.json") as PackageJson;
    normalize(pkg);
    this.pkg = pkg as Package;

    // eslint-disable-next-line node/no-process-env
    this.dir = { ...paths(this.pkg.name, { suffix: "" }), run: process.env.XDG_RUNTIME_DIR };
  }
}
