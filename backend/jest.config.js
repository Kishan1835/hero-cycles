module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/types/**'],
  coverageThreshold: {
    global: { branches: 60, functions: 65, lines: 65, statements: 65 },
  },
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  clearMocks: true,
};
