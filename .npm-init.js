/* global prompt */
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const name = cwd.split('/').pop();

const editorconfig = `root = true

[*]
indent_style = space
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
indent_size = 2

[*.md]
trim_trailing_whitespace = false
`;

const eslintignore = `node_modules
coverage
lib
`;

const eslintrc = `module.exports = {
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
`;

const gitignore = `# dependencies
node_modules
package-lock.json

# files
.DS_Store
.env

# logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# test
coverage
junit.xml
jest-report

# build
lib
dist
packed
`;

const npmrc = `package-lock=false`;

const babelrc = `{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "7.6"
        }
      }
    ]
  ],
  "plugins": [
    "@babel/plugin-proposal-class-properties",
    "@babel/plugin-proposal-object-rest-spread"
  ]
}`;

const files = [
  ['.babelrc', babelrc],
  ['.editorconfig', editorconfig],
  ['.eslintignore', eslintignore],
  ['.eslintrc.js', eslintrc],
  ['.gitignore', gitignore],
  ['.npmrc', npmrc],
  ['src/index.js', `console.log('hi');`],
];

fs.mkdirSync(path.join(cwd, 'src'));

files.forEach(file => {
  const [fileName, fileContent] = file;
  const filePath = path.join(cwd, fileName);
  try {
    fs.lstatSync(filePath);
  } catch (err) {
    fs.writeFileSync(filePath, fileContent);
  }
});

module.exports = {
  name,
  description: prompt('An awesome project description...', ''),
  author: {
    name: 'kpman',
    email: 's92f002@gmail.com',
  },
  license: 'MIT',
  version: '0.0.0',
  main: 'src/index.js',
  scripts: {
    build: 'npm run clean && babel src -d lib --ignore __tests__',
    clean: 'rimraf lib',
    precommit: 'lint-staged',
    lint: 'eslint src',
    'lint:fix': 'npm run lint -- --fix',
    prepublish: 'npm run build',
    test: 'npm run lint && npm run testonly',
    testonly: 'jest --detectOpenHandles',
    'testonly:watch': 'jest --runInBand --watch --detectOpenHandles',
    'testonly:cov':
      'jest --coverage --runInBand --forceExit --detectOpenHandles',
    preversion: 'npm run test',
  },
  devDependencies: {
    '@babel/cli': '^7.0.0-beta.51',
    '@babel/core': '^7.0.0-beta.51',
    '@babel/plugin-proposal-class-properties': '^7.0.0-beta.51',
    '@babel/plugin-proposal-object-rest-spread': '^7.0.0-beta.51',
    '@babel/preset-env': '^7.0.0-beta.51',
    'babel-core': '^7.0.0-0',
    'babel-jest': '^23.0.1',
    eslint: '^5.0.0',
    'eslint-config-prettier': '^2.9.0',
    'eslint-config-yoctol-base': '^0.15.1',
    'eslint-plugin-import': '^2.10.0',
    'eslint-plugin-prettier': '^2.6.0',
    husky: '^0.14.3',
    jest: '^23.1.0',
    'jest-junit': '^5.1.0',
    'lint-staged': '^7.0.2',
    prettier: '^1.13.5',
    'prettier-package-json': '^1.6.0',
    rimraf: '^2.6.2',
  },
  jest: {
    coverageDirectory: './coverage/',
    transformIgnorePatterns: ['node_modules', 'lib'],
    testEnvironment: 'node',
    testPathIgnorePatterns: ['node_modules', 'lib'],
    timers: 'fake',
    resetModules: true,
    resetMocks: true,
    reporters: ['default', 'jest-junit'],
  },
  'lint-staged': {
    '*.md': ['prettier --write', 'git add'],
    '*.{json, babelrc}': [
      'prettier --parser json-stringify --write',
      'git add',
    ],
    '*.js': ['eslint --fix', 'git add'],
    '*package.json': [
      'prettier-package-json --write',
      'prettier --parser json-stringify --write',
      'git add',
    ],
  },
  prettier: {
    trailingComma: 'es5',
    singleQuote: true,
  },
};
