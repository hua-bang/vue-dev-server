// sourceMap
function injectSourceMapToBlock (block, lang) {
  const map = Base64.toBase64(
    JSON.stringify(block.map)
  )
  let mapInject

  switch (lang) {
    case 'js': mapInject = `//# sourceMappingURL=data:application/json;base64,${map}\n`; break;
    case 'css': mapInject = `/*# sourceMappingURL=data:application/json;base64,${map}*/\n`; break;
    default: break;
  }

  return {
    ...block,
    code: mapInject + block.code
  }
}

function injectSourceMapToScript (script) {
  return injectSourceMapToBlock(script, 'js')
}

function injectSourceMapsToStyles (styles) {
  return styles.map(style => injectSourceMapToBlock(style, 'css'))
}

module.exports = {
  injectSourceMapToBlock,
  injectSourceMapToScript,
  injectSourceMapsToStyles
};