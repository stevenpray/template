"use strict";

const dotenv = require("dotenv-defaults");
const expand = require("dotenv-expand");

module.exports = expand(dotenv.config());
