const { parseArgs } = require("node:util");
const { resolve, join, basename } = require("node:path");
const { copyFileSync } = require("node:fs");
const pkg = require("../package.json");

const {
  values: { to },
} = parseArgs({ options: { to: { type: "string" } } });

if (to === undefined) {
  throw new Error("required argument `to` missing");
}

const umdAbsolutePath = resolve(__dirname, join("..", pkg.jsdelivr));

copyFileSync(umdAbsolutePath, join(to, basename(pkg.jsdelivr)));
