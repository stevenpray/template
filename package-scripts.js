const { rimraf, series } = require("nps-utils");

const env = process.env.NODE_ENV || "development";
const dir = { bin: "bin", out: "lib", src: "src" };

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
