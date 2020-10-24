#!/usr/bin/env node

require("dotenv-expand")(require("dotenv").config());
const { pathExistsSync } = require("fs-extra");
const root = require("app-root-path");

/**
 * @type {import("../src")}
 */
const lib = (() => {
  if (pathExistsSync(root.resolve("lib/index.js"))) {
    return root.require("lib");
  }
  require("@babel/register")({ extensions: [".js", ".ts"] });
  return root.require("src");
})();

lib.main(process.argv).catch((error) => {
  console.error(error);
  process.exit(error?.code ?? 1);
});
