const express = require("express");
const router = require("./router");
const fs = require('fs')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')

// 创建 express 应用
const app = express();

// 使用cors解决跨域问题
app.use(cors())
//使用bodyparser 解析body
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// 监听 / 路径的 get 请求
app.use(router);

const privateKey = fs.readFileSync('./https/3965882_book.guzhihao.cn.key')
const certificate = fs.readFileSync('./https/3965882_book.guzhihao.cn.pem')
const credentials = { key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const SSLPORT = 18082
httpsServer.listen(SSLPORT, () => {
  const { address, port } = server.address();
  console.log("Http Server is running on https://", address, port);
})

// 使 express 监听 5000 端口号发起的 http 请求
const server = app.listen(5000, function () {
  const { address, port } = server.address();
  console.log("Http Server is running on http://", address, port);
});
