module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts', // exclude index.ts
  ],
  modulePathIgnorePatterns: ["<rootDir>/docs/"],
  moduleNameMapper: {
    "^./tools.js$": "<rootDir>/test/helpers/index.ts",
    "^./toolsHandler.js$": "<rootDir>/test/helpers/index.ts",
  },
};
