const path = require("node:path");

module.exports = {
  entry: "./src/index.js",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "esm-meilisearch-js-test.js",
  },
  target: "node",
  resolve: {
    extensions: [".js"], // resolve all the modules other than index.ts
  },
};
