"use strict";

const dotenv = require("dotenv-defaults");
const expand = require("dotenv-expand");

expand(dotenv.config());

require("jest-extended");
