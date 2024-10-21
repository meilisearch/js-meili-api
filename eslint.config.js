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
      // @TODO: Remove the ones between "~~", adapt code
      // ~~
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      //"@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      // ~~
      "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
      // @TODO: Should be careful with this rule, should leave it be and disable
      //       it within files where necessary with explanations
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        // argsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#argsignorepattern
        // varsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#varsignorepattern
        { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // @TODO: Not recommended to disable rule, should instead disable locally
      //       with explanation
      "@typescript-eslint/ban-ts-ignore": "off",
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
