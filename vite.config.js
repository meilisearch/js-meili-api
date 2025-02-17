import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const indexInput = "src/index.ts";
const tokenInput = "src/token.ts";
const globalVarName = pkg.name;

export default defineConfig(({ mode }) => {
  const isCJSBuild = mode === "production";

  return {
    build: {
      // for UMD build we do not want to empty directory, so previous builds stay intact
      emptyOutDir: isCJSBuild,
      // don't minify CJS build, Node.js doesn't benefit from it
      minify: !isCJSBuild,
      sourcemap: true,
      // UMD build should target the lowest level ES,
      // while CJS the lowest Node.js LTS compatible version
      target: isCJSBuild ? "es2022" : "es6",
      lib: {
        // leave out token export from UMD build
        entry: isCJSBuild ? [indexInput, tokenInput] : indexInput,
        name: isCJSBuild ? undefined : globalVarName,
        formats: isCJSBuild ? ["cjs"] : ["umd"],
        fileName: (format, entryName) => {
          switch (format) {
            case "umd":
              return `umd/${entryName}.min.js`;
            case "cjs":
              return `cjs/${entryName}.cjs`;
            default:
              throw new Error(`unsupported format ${format}`);
          }
        },
      },
      rollupOptions: isCJSBuild
        ? {
            // make sure external imports that should not be bundled are listed here for CJS build
            external: ["node:crypto"],
          }
        : // the following code enables Vite in UMD mode to extend the global object with all of
          // the exports, and not just a property of it ( https://github.com/vitejs/vite/issues/11624 )
          // TODO: Remove this in the future ( https://github.com/meilisearch/meilisearch-js/issues/1806 )
          {
            output: {
              footer: `(function () {
                           if (typeof self !== "undefined") {
                             var clonedGlobal = Object.assign({}, self.${globalVarName});
                             delete clonedGlobal.default;
                             Object.assign(self, clonedGlobal);
                           }
                       })();`,
            },
          },
    },
    test: {
      include: ["tests/**/*.test.ts"],
      exclude: ["tests/env/**"],
      fileParallelism: false,
      testTimeout: 100_000, // 100 seconds
      coverage: { include: ["src/**/*.ts"] },
    },
  };
});
