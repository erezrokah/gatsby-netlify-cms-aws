module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:jest/recommended',
    'plugin:react/recommended',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    'jest/globals': true,
  },
  plugins: ['react', 'jest', 'jsx-a11y', 'import'],
  globals: {
    graphql: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
