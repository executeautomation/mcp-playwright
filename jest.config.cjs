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
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts'
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/docs/",
    "<rootDir>/dist/"
  ],
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.test.json'
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
