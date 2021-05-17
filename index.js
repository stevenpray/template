"use strict";

const dotenv = require("dotenv-defaults");
const expand = require("dotenv-expand");

expand(dotenv.config());

require("@babel/register")({ extensions: [".js", ".ts"] });

// eslint-disable-next-line import/no-unresolved
module.exports = require("./src");
