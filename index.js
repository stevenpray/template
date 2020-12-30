"use strict";

const fs = require("fs-extra");
const root = require("app-root-path");
require("./env");

/**
 * @type {import("./src")}
 */
const lib = (() => {
  if (fs.pathExistsSync(root.resolve("lib"))) {
    return root.require("lib");
  }
  require("@babel/register")({ extensions: [".js", ".ts"] });
  return root.require("src");
})();

module.exports = lib;
