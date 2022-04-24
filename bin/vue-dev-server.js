#!/usr/bin/env node

const express = require('express')
const { vueMiddleware } = require('../middleware')

const app = express()

// 获取目录 由于启动服务的时候是在test目录下 
// 所以这里的root是test目录
const root = process.cwd();

// vueMiddleware中间件
app.use(vueMiddleware())

app.use(express.static(root))

app.listen(3000, () => {
  console.log('server running at http://localhost:3000')
})
