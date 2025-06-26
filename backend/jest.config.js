/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // preset: 'ts-jest', // No need for ts-jest in a JS project
  testEnvironment: 'node',
  clearMocks: true,
  coverageProvider: "v8",
};