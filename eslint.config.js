const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const tsdoc = require("eslint-plugin-tsdoc");
const vitest = require("@vitest/eslint-plugin");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ["dist/", "tests/env/", "coverage/", "playgrounds/", "docs/"],
  },
  // Standard linting for js files
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.node },
    plugins: { eslint },
    rules: eslint.configs.recommended.rules,
  },
  // TypeScript linting for ts files
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts"],
    languageOptions: {
      ...config.languageOptions,
      globals: { ...config.languageOptions?.globals, ...globals.node },
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: "tsconfig.eslint.json",
      },
    },
    plugins: { ...config.plugins, tsdoc },
    rules: {
      ...config.rules,
      "tsdoc/syntax": "error",
    },
  })),
  // Vitest linting for test files
  {
    files: ["tests/*.ts"],
    plugins: { vitest },
    rules: vitest.configs.recommended.rules,
  },
  prettier,
];
