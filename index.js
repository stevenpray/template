/* eslint-disable import/no-unresolved */
const fs = require("fs-extra");
const root = require("app-root-path");

/**
 * @type {import("./src")}
 */
let main;

if (fs.pathExistsSync(root.resolve("lib/index.js"))) {
  main = require("./lib");
} else {
  require("@babel/register")({ extensions: [".js", ".ts"] });
  main = require("./src");
}

module.exports = main;
