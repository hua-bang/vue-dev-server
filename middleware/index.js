const fs = require('fs')
const stat = require('util').promisify(fs.stat)
const root = process.cwd()
const path = require('path')
const parseUrl = require('parseurl')
const { transformModuleImports } = require('./helper/transformModuleImports')
const { loadPkg } = require('./helper/loadPkg')
const { readSource } = require('./helper/readSource')
const TsxCompiler = require('./helper/tsxCompiler');
const { bundleSFC } = require('./helper/bundleSFC');

const fileMap = {
  vue: {
    checkFn(path) {
      return path.endsWith('.vue');
    },
    checkUpdateTime: true,
    async getCode(req, key, cacheData) {
      const result = await bundleSFC(req);
      const out = result.code;
      cacheData(key, out, result.updateTime);
      return out;
    },
    mime: 'application/javascript'
  },
  js: {
    checkFn(path) {
      return path.endsWith('.js');
    },
    checkUpdateTime: true,
    async getCode(req, key, cacheData) {
      const result = await readSource(req);
      const out = transformModuleImports(result.source);
      cacheData(key, out, result.updateTime);
      return out;
    },
    mime: 'application/javascript'
  },
  modules: {
    checkFn(path) {
      return path.startsWith('/__modules/');
    },
    checkUpdateTime: false,
    async getCode(req, key, cacheData) {
      const pkg = req.path.replace(/^\/__modules\//, '');
      const source = (await loadPkg(pkg)).toString();
      const out = transformModuleImports(source);
      cacheData(key, out, false);
      return out;
    },
    mime: 'application/javascript'
  },
  tsx: {
    checkFn(path) {
      return path.endsWith('.tsx');
    },
    checkUpdateTime: true,
    async getCode(req, key, cacheData) {
      let tsxCompiler = new TsxCompiler();
      const out = await tsxCompiler.compileFileByPath(req);
      cacheData(key, out, false);
      return out;
    },
    mime: 'application/javascript'
  }
};

const defaultOptions = {
  cache: true
}

const fileMiddleware = (options = defaultOptions) => {
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

  // 返回请求
  function send(res, source, mime) {
    res.setHeader('Content-Type', mime)
    res.end(source)
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

  return async (req, res, next) => {
    const key = parseUrl(req).pathname;

    const info = Object.keys(fileMap).find(key => {
      return fileMap[key].checkFn(req.path);
    });

    if (!info) {
      next();
      return;
    } 
    const { checkUpdateTime, getCode, mime } = fileMap[info];
    let code = await tryCache(key, checkUpdateTime);
    if (code) {
      send(res, code, mime);
      return;
    }
    code = await getCode(req, key, cacheData);
    send(res, code, mime);
  }
}

exports.fileMiddleware = fileMiddleware
