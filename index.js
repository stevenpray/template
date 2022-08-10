"use strict";

try {
  // eslint-disable-next-line import/no-unresolved -- Handle unresolved module in catch block.
  module.exports = require("./lib");
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") {
    throw error;
  }

  // Loads environment variables from .env files
  // with support for defaults and expansion.
  const { config } = require("dotenv-defaults");
  const { expand } = require("dotenv-expand");
  expand(config());

  // Use Babel require hook to compile files on the fly.
  require("@babel/register")({ extensions: [".js", ".ts"] });

  module.exports = require("./src");
}
