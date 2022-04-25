const vueCompiler = require('@vue/component-compiler');
const { injectSourceMapToScript, injectSourceMapsToStyles } = require('./injectSourceMap');
const { readSource } = require('./readSource');

// vue 的compiler
const compiler = vueCompiler.createDefaultCompiler();

/**
  * 编译单vue文件
  * @param {*} req 
  */
async function bundleSFC (req) {
  const { filepath, source, updateTime } = await readSource(req)
  const descriptorResult = compiler.compileToDescriptor(filepath, source)
  const assembledResult = vueCompiler.assemble(compiler, filepath, {
    ...descriptorResult,
    script: injectSourceMapToScript(descriptorResult.script),
    styles: injectSourceMapsToStyles(descriptorResult.styles)
  })
  return { ...assembledResult, updateTime }
}

exports.bundleSFC = bundleSFC;