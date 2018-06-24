module.exports = {
  extends: ['yoctol-base', 'prettier'],
  env: {
    node: true,
    jest: true,
    jasmine: true,
  },
  plugins: ['import', 'prettier'],
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'es5',
        singleQuote: true,
      },
    ],
  },
};
