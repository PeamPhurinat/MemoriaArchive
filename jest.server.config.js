/** @type {import('jest').Config} */
module.exports = {
  displayName: 'server-unit',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  collectCoverageFrom: [
    'server/src/services/**/*.js',
    'server/src/controllers/**/*.js',
    'server/src/middleware/**/*.js',
  ],
  coverageReporters: ['text', 'html'],
  coverageDirectory: 'coverage/server',
  // Prevent react-scripts from interfering
  transform: {},
};
