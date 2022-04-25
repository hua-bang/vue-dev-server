const fs = require('fs')
const path = require('path')
const readFile = require('util').promisify(fs.readFile)

const pkgMap = {
  vue: {
    resolvePath: 'vue',
    relativePath: 'vue.esm.browser.js'
  },
  react: {
    resolvePath: 'react',
    relativePath: 'react.development.js'
  },
  'react-dom': {
    resolvePath: 'react-dom',
    relativePath: 'react-dom.production.min.js'
  },
};

/**
 * loadPkg 加载package包的文件 目前仅支持vue 后续扩展了react 和 react-dom
 * @param {*} pkg 包的名称
 * @returns 对应包的源码 
 */
async function loadPkg(pkg) {
  const pkgInfo = pkgMap[pkg];
  if (!pkgInfo) {
    // TODO
    // check if the package has a browser es module that can be used
    // otherwise bundle it with rollup on the fly?
    throw new Error('npm imports support are not ready yet.');
  }
  const { resolvePath, relativePath, getPath } = pkgInfo;
  if (getPath) {
    return getPath();
  }
  const dir = path.dirname(require.resolve(resolvePath));
  const filepath = path.join(dir, relativePath);
  return readFile(filepath);
}

exports.loadPkg = loadPkg
