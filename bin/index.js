#!/usr/bin/env node

const fs = require("fs-extra");
const root = require("app-root-path");
require("../env.js");

/**
 * @type {import("../src")}
 */
const lib = (() => {
  if (fs.pathExistsSync(root.resolve("lib"))) {
    return root.require("lib");
  }
  const register = require("@babel/register");
  register({ extensions: [".js", ".ts"] });
  return root.require("src");
})();

void lib.cli(process.argv);
