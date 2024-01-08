// @TODO Remove this once merged with eslint updates
// eslint-disable-next-line tsdoc/syntax
/** @type {import('jest').Config} */
const config = {
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
  verbose: true,
  testPathIgnorePatterns: ['meilisearch-test-utils', 'env'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      'ts-jest': {
        tsConfig: '<rootDir>/tsconfig.json',
      },
    },
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  globalSetup: './jest-disable-built-in-fetch.js',
  projects: [
    {
      preset: 'ts-jest',
      displayName: 'browser',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: [
        'meilisearch-test-utils',
        'env/',
        'token.test.ts',
      ],
    },
    {
      preset: 'ts-jest',
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: ['meilisearch-test-utils', 'env/'],
    },
  ],
}

module.exports = config
