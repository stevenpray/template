"use strict";

const root = require("app-root-path");
const utils = require("nps-utils");
const pkg = require("./package.json");

const dir = {
  out: root.resolve(pkg.directories.lib),
  src: root.resolve(pkg.directories.src),
};

const env = process.env.NODE_ENV || "development";

module.exports = {
  options: {
    logLevel: "warn",
  },
  scripts: {
    clean: utils.rimraf(dir.out),
    start: "nodemon --no-warnings bin --debug",
    build: utils.series(
      "tsc --project tsconfig.build.json",
      `babel --quiet --env-name=${env} --extensions=".js,.ts" --ignore="**/*.test.ts" --source-maps --out-dir="${dir.out}" "${dir.src}"`,
    ),
    lint: {
      default: utils.series.nps("lint.docs", "lint.scripts", "lint.types"),
      docs: "markdownlint .",
      scripts: "eslint .",
      types: "tsc",
    },
    test: utils.crossEnv("NODE_ENV=test jest --coverage"),

    npm: {
      prepack: utils.series.nps("clean", "build"),
      postpack: utils.series.nps("clean"),
      start: utils.series.nps("clean", "start"),
      test: utils.series.nps("lint", "test"),
    },
  },
};
