const fs = require('fs')
const path = require('path')
const readFile = require('util').promisify(fs.readFile)

/**
 * loadPkg 加载package包的文件 目前仅支持vue
 * @param {*} pkg 包的名称
 * @returns 对应包的源码 
 */
async function loadPkg(pkg) {
  if (pkg === 'vue') {
    const dir = path.dirname(require.resolve('vue'))
    const filepath = path.join(dir, 'vue.esm.browser.js')
    return readFile(filepath)
  }
  else {
    // TODO
    // check if the package has a browser es module that can be used
    // otherwise bundle it with rollup on the fly?
    throw new Error('npm imports support are not ready yet.')
  }
}

exports.loadPkg = loadPkg
