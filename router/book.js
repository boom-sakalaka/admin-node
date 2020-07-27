const express = require("express");
const router = express.Router();
const multer = require('multer')
const { UPLOAD_PATH } = require('../utils/constant')
const Rusult = require("../models/Result")
const Book = require('../models/Book')
const boom = require('boom');
const { json } = require("body-parser");
const { decode } = require('../utils')
const bookService = require('../services/book');
const { Result } = require("express-validator");
const { response } = require("express");

router.post('/upload',
multer({ dest: `${UPLOAD_PATH}/book` }).single('file'),
(req,res,next) => {
  if(!req.file || req.file.length === 0){
    new Rusult('上传电子书失败').fail(res)
  }else{
    const book = new Book(req.file)
    book.parse().then(book => {
      //console.log('112321' + JSON.stringify(book,null,4))
      new Rusult(book,'上传电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
    
  }
})

router.post('/create', (req, res, next) => {
  const { username = ''} = decode(req)
  if(username){
    req.body.username = username
  }
  const book = new Book(null,req.body)
  bookService.insertBook(book).then(response => {
    new Rusult('添加电子书成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})


router.post('/update', (req, res, next) => {
  const { username = ''} = decode(req)
  if(username){
    req.body.username = username
  }
  const book = new Book(null,req.body)
  bookService.updateBook(book).then(response => {
    new Rusult('更新电子书成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})


router.get('/get', (req,res,next) => {
  const {fileName} = req.query
  if(!fileName){
    next(boom.badRequest(new Error('参数fileName不能为空')))
  }else{
    bookService.getBook(fileName).then(book => {
      new Rusult(book,'获取图书信息成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
})

router.get('/category', (req,res,next) => {
  bookService.getCategory().then(category => {
    new Rusult(category,'获取分类成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

router.get('/list', (req, res, next) => {
  bookService.listBook(req.query).then(({ list,count,page, pageSize }) => {
    new Rusult({ list, count, page: +page, pageSize: +pageSize},'获取图书列表成功').success(res)
  }).catch(err => {
    next(boom.badImplementation(err))
  })
})

module.exports = router