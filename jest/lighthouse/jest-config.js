'use strict';

module.exports = {
  testEnvironment: 'node',
  rootDir: '../lighthouse',
  transform: {
    '^.+\\.js?$': '<rootDir>/../jest-preprocess.js',
  },
  testMatch: ['**/lighthouse.js'],
  reporters: ['default', 'jest-junit'],
  globalSetup: '<rootDir>/runLighthouse.js',
};
