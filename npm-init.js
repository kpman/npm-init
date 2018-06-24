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

/*
  decode function and required functions copied from
  https://github.com/npm/ini
  in order to parse github config without added reqs
*/

/* eslint-disable */
function dotSplit(str) {
  return str
    .replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
    .replace(/\\\./g, '\u0001')
    .split(/\./)
    .map(function(part) {
      return part
        .replace(/\1/g, '\\.')
        .replace(/\2LITERAL\\1LITERAL\2/g, '\u0001');
    });
}

function decode(str) {
  var out = {};
  var p = out;
  var section = null;
  //          section     |key      = value
  var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i;
  var lines = str.split(/[\r\n]+/g);

  lines.forEach(function(line, _, __) {
    if (!line || line.match(/^\s*[;#]/)) return;
    var match = line.match(re);
    if (!match) return;
    if (match[1] !== undefined) {
      section = unsafe(match[1]);
      p = out[section] = out[section] || {};
      return;
    }
    var key = unsafe(match[2]);
    var value = match[3] ? unsafe(match[4] || '') : true;
    switch (value) {
      case 'true':
      case 'false':
      case 'null':
        value = JSON.parse(value);
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2);
      if (!p[key]) {
        p[key] = [];
      } else if (!Array.isArray(p[key])) {
        p[key] = [p[key]];
      }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value);
    } else {
      p[key] = value;
    }
  });

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out)
    .filter(function(k, _, __) {
      if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) {
        return false;
      }
      // see if the parent section is also an object.
      // if so, add it to that, and mark this one for deletion
      var parts = dotSplit(k);
      var p = out;
      var l = parts.pop();
      var nl = l.replace(/\\\./g, '.');
      parts.forEach(function(part, _, __) {
        if (!p[part] || typeof p[part] !== 'object') p[part] = {};
        p = p[part];
      });
      if (p === out && nl === l) {
        return false;
      }
      p[nl] = out[k];
      return true;
    })
    .forEach(function(del, _, __) {
      delete out[del];
    });

  return out;
}

function isQuoted(val) {
  return (
    (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
  );
}

function safe(val) {
  return typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 && isQuoted(val)) ||
    val !== val.trim()
    ? JSON.stringify(val)
    : val.replace(/;/g, '\\;').replace(/#/g, '\\#');
}

function unsafe(val, doUnesc) {
  val = (val || '').trim();
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2);
    }
    try {
      val = JSON.parse(val);
    } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false;
    var unesc = '';
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i);
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c;
        } else {
          unesc += '\\' + c;
        }
        esc = false;
      } else if (';#'.indexOf(c) !== -1) {
        break;
      } else if (c === '\\') {
        esc = true;
      } else {
        unesc += c;
      }
    }
    if (esc) {
      unesc += '\\';
    }
    return unesc;
  }
  return val;
}
/* eslint-enable */

function getGitConfig(gitConfFile) {
  let conf;
  const exists = fs.existsSync(gitConfFile);
  conf = {
    user: {
      name: '',
      email: '',
    },
  };
  if (exists) {
    conf = decode(fs.readFileSync(gitConfFile, 'utf-8'));
  } else {
    console.log('\nGit configuration file does not exist!!!...\n');
  }
  return conf;
}

const homeDir =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const gitConfig = path.join(homeDir, '.gitconfig');
const git = getGitConfig(gitConfig);

module.exports = {
  name,
  description: prompt('An awesome project description...', ''),
  author: {
    name: git.user.name,
    email: git.user.email,
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
