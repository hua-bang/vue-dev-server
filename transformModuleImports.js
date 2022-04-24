const recast = require('recast')
const isPkg = require('validate-npm-package-name')

/**
 * 通过`recast`去转译`js`文件中的`import`
 * @param {*} code 源码
 * @returns string 源代码转译后的代码
 */
function transformModuleImports(code) {
  const ast = recast.parse(code)
  recast.types.visit(ast, {
    visitImportDeclaration(path) {
      const source = path.node.source.value
      if (!/^\.\/?/.test(source) && isPkg(source)) {
        path.node.source = recast.types.builders.literal(`/__modules/${source}`)
      }
      this.traverse(path)
    }
  })
  return recast.print(ast).code
}

exports.transformModuleImports = transformModuleImports
