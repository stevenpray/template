const { rimraf, series } = require("nps-utils");
const root = require("app-root-path");
require("./env.js");

/**
 * @type {import("type-fest").PackageJson}
 */
const pkg = root.require("package.json");

const dir = { ...pkg.directories, src: "src" };

const env = process.env.NODE_ENV || "development";

module.exports = {
  options: {
    logLevel: "warn",
  },
  scripts: {
    clean: rimraf(dir.out),
    build: series(
      "tsc --project tsconfig.types.json",
      `babel --quiet --env-name=${env} --extensions=".js,.ts" --ignore "**/*.test.ts" --source-maps --out-dir="${dir.out}" "${dir.src}"`,
    ),
    lint: `eslint "${dir.bin}/**" "${dir.src}/**" *.js *.md`,
    test: "jest --coverage",

    npm: {
      prepack: series.nps("clean", "build"),
      postpack: series.nps("clean"),
      start: "nodemon bin/index.js",
      test: series.nps("lint", "test"),
    },
  },
};
