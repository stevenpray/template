#!/usr/bin/env node

require("dotenv-expand")(require("dotenv").config());
const { main } = require("..");

main(process.argv).catch((error) => {
  console.error(error);
  process.exit(error?.code ?? 1);
});
