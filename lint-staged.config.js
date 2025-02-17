/**
 * @type {import("lint-staged").Configuration}
 * @see {@link https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration}
 * @see {@link https://github.com/lint-staged/lint-staged?tab=readme-ov-file#using-js-configuration-files}
 */
export default { "*.{js,ts}": ["prettier -w", "eslint"] };
