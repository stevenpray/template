#!/usr/bin/env -S node --title=template --enable-source-maps --no-warnings --unhandled-rejections=throw

// eslint-disable-next-line lines-around-directive, node/shebang -- Linux requires the `-S` option on env to split argument string.
"use strict";

void require("..").cli.exec();
