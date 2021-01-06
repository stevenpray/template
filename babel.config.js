"use strict";

/**
 * @param {import("@babel/core").ConfigAPI} api
 * @return {import("@babel/core").TransformOptions}
 */
module.exports = ({ env }) => {
  return {
    ignore: ["**/*.d.ts"],
    plugins: [
      ["babel-plugin-transform-typescript-metadata"],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      ["@babel/plugin-proposal-do-expressions"],
      ["@babel/plugin-proposal-export-default-from"],
      ["@babel/plugin-proposal-export-namespace-from"],
      ["@babel/plugin-proposal-function-bind"],
      ["@babel/plugin-proposal-function-sent"],
      ["@babel/plugin-proposal-logical-assignment-operators"],
      ["@babel/plugin-proposal-pipeline-operator", { proposal: "smart" }],
      ["@babel/plugin-proposal-private-methods", { loose: true }],
      ["@babel/plugin-proposal-throw-expressions"],
      ["@babel/plugin-transform-runtime", { corejs: 3 }],
    ],
    presets: [
      ["@babel/preset-env", { bugfixes: true, corejs: 3, useBuiltIns: "usage" }],
      ["@babel/preset-react", { development: !env("production"), runtime: "automatic" }],
      ["@babel/preset-typescript", { allowNamespaces: true, allowDeclareFields: true }],
    ],
  };
};
