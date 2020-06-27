const express = require("express");
const router = express.Router();
const Result = require('../models/Result');
const { login,findUser } = require('../services/user')
const { md5, decode } = require('../utils')
const { PWD_SALT, PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken');
const Rusult = require("../models/Result");
const e = require("express");
router.post('/login',
[
  body('username').isString().withMessage('用户名必须为字符'),
  body('password').isString().withMessage('密码必须为字符串')
],
(req, res, next) => {
  const err = validationResult(req)
  if(!err.isEmpty()){
    const [{msg}] = err.errors
    next(boom.badRequest(msg))
  }else{
    let { username, password } = req.body
    password = md5(`${password}${PWD_SALT}`)
    login(username, password).then(user => {
      if (!user || user.length === 0) {
        new Result('登录失败').fail(res)
      } else {
        const token = jwt.sign({username},PRIVATE_KEY,{expiresIn:JWT_EXPIRED})
        new Result({token},'登录成功').success(res)
      } 
    })
  }
  // if(username === 'admin' && password === 'admin'){
  //   new Rusult('登录成功').success(res)
  // }else{
  //   new Result('登录失败').fail(res)
  // }
})

router.get("/info", (req, res, next) => {
  const decoded = decode(req)
  if (decoded && decoded.username) {
    findUser(decoded.username).then(user => {
      if (user) {
        user.roles = [user.role]
        new Result(user, '获取用户信息成功').success(res)
      } else {
        new Result('获取用户信息失败').fail(res)
      }
    })
  } else {
    new Result('用户信息解析失败').fail(res)
  }
});

module.exports = router;
