#!/usr/bin/env node

const dotenv = require("dotenv");
const expand = require("dotenv-expand");
const fs = require("fs-extra");
const root = require("app-root-path");

expand(dotenv.config());

/**
 * @type {import("../src")}
 */
const lib = (() => {
  if (fs.pathExistsSync(root.resolve("lib/index.js"))) {
    return root.require("lib");
  }
  const register = require("@babel/register");
  register({ extensions: [".js", ".ts"] });
  return root.require("src");
})();

lib.main(process.argv).catch((error) => {
  console.error(error);
  process.exit(error?.code ?? 1);
});
