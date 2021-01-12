"use strict";

const path = require("path");
const fs = require("fs-extra");
require("./env");

/**
 * @type {import("./src")}
 */
const lib = (() => {
  const index = path.resolve(__dirname, "lib", "index.js");
  if (fs.pathExistsSync(index)) {
    // eslint-disable-next-line import/no-dynamic-require
    return require(index);
  }
  require("@babel/register")({ extensions: [".js", ".ts"] });
  // eslint-disable-next-line import/no-unresolved
  return require("./src");
})();

module.exports = lib;
