"use strict";

require("reflect-metadata");
const { config } = require("dotenv-defaults");
const { expand } = require("dotenv-expand");
const extended = require("jest-extended");

expand(config());
expect.extend(extended);
