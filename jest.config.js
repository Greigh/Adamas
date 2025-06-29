module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFiles: ['<rootDir>/test/jest.setup.js'],
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/test/**/*.test.js']
};


