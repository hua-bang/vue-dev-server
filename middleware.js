const vueCompiler = require('@vue/component-compiler')
const fs = require('fs')
const stat = require('util').promisify(fs.stat)
const root = process.cwd()
const path = require('path')
const parseUrl = require('parseurl')
const { transformModuleImports } = require('./transformModuleImports')
const { loadPkg } = require('./loadPkg')
const { readSource } = require('./readSource')

const defaultOptions = {
  cache: true
}

const vueMiddleware = (options = defaultOptions) => {
  // 用于缓存
  let cache
  let time = {}
  if (options.cache) {
    // 使用lru-cache [缓存淘汰算法--LRU算法](https://zhuanlan.zhihu.com/p/34989978)
    const LRU = require('lru-cache')

    cache = new LRU({
      max: 500,
      length: function (n, key) { return n * 2 + key.length }
    })
  }

  // vue 的compiler
  const compiler = vueCompiler.createDefaultCompiler()

  // 返回请求
  function send(res, source, mime) {
    res.setHeader('Content-Type', mime)
    res.end(source)
  }

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
  
  // 获得缓存
  async function tryCache (key, checkUpdateTime = true) {
    const data = cache.get(key)

    if (checkUpdateTime) {
      const cacheUpdateTime = time[key]
      const fileUpdateTime = (await stat(path.resolve(root, key.replace(/^\//, '')))).mtime.getTime()
      if (cacheUpdateTime < fileUpdateTime) return null
    }

    return data
  }

  /**
   * 缓存数据
   * @param {*} key 
   * @param {*} data 
   * @param {*} updateTime
   */
  function cacheData (key, data, updateTime) {
    const old = cache.peek(key)

    if (old != data) {
      cache.set(key, data)
      if (updateTime) time[key] = updateTime
      return true
    } else return false
  }

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

  return async (req, res, next) => {
    if (req.path.endsWith('.vue')) {  // 处理vue文件      
      const key = parseUrl(req).pathname
      // 找文件缓存
      let out = await tryCache(key)

      if (!out) {
        // Bundle Single-File Component
        const result = await bundleSFC(req)
        out = result
        cacheData(key, out, result.updateTime)
      }
      
      send(res, out.code, 'application/javascript')
    } else if (req.path.endsWith('.js')) { // 处理js文件
      const key = parseUrl(req).pathname
      // 找文件缓存
      let out = await tryCache(key)

      if (!out) {
        // transform import statements 转换import
        const result = await readSource(req)
        out = transformModuleImports(result.source)
        cacheData(key, out, result.updateTime)
      }

      send(res, out, 'application/javascript')
    } else if (req.path.startsWith('/__modules/')) {  // 处理/__modules/文件
      const key = parseUrl(req).pathname
      const pkg = req.path.replace(/^\/__modules\//, '')

      // 找文件缓存
      let out = await tryCache(key, false) // Do not outdate modules
      if (!out) {
        // 通过loadPkg去获取源码
        out = (await loadPkg(pkg)).toString()
        cacheData(key, out, false) // Do not outdate modules
      }

      send(res, out, 'application/javascript')
    } else {
      next()
    }
  }
}

exports.vueMiddleware = vueMiddleware
