module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  collectCoverage: true,
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/coverage/**'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true, 
};