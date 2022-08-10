"use strict";

// eslint-disable-next-line jsdoc/check-examples -- Rule not supported with ESLint 8.
/**
 * @type {import("@babel/core").ConfigFunction}
 */
const config = (api) => {
  return {
    comments: false,
    ignore: ["**/*.d.ts"],
    plugins: [
      ["babel-plugin-module-resolver", { alias: {} }],
      ["babel-plugin-transform-typescript-metadata"],
      ["@babel/plugin-proposal-decorators", { version: "legacy" }],
      ["@babel/plugin-proposal-class-static-block"],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      ["@babel/plugin-proposal-do-expressions"],
      ["@babel/plugin-proposal-export-default-from"],
      ["@babel/plugin-proposal-export-namespace-from"],
      ["@babel/plugin-proposal-function-bind"],
      ["@babel/plugin-proposal-function-sent"],
      ["@babel/plugin-proposal-logical-assignment-operators"],
      ["@babel/plugin-proposal-pipeline-operator", { proposal: "minimal" }],
      ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      ["@babel/plugin-proposal-throw-expressions"],
      ["@babel/plugin-transform-runtime", { corejs: 3 }],
    ],
    presets: [
      ["@babel/preset-env", { bugfixes: true, corejs: 3, useBuiltIns: "usage" }],
      ["@babel/preset-react", { development: !api.env("production"), runtime: "automatic" }],
      ["@babel/preset-typescript", { allowNamespaces: true, allowDeclareFields: true }],
    ],
  };
};

module.exports = config;
