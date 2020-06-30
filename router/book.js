const express = require("express");
const router = express.Router();
const multer = require('multer')
const { UPLOAD_PATH } = require('../utils/constant')
const Rusult = require("../models/Result")
const Book = require('../models/Book')
const boom = require('boom');
const { json } = require("body-parser");

router.post('/upload',
multer({ dest: `${UPLOAD_PATH}/book` }).single('file'),
(req,res,next) => {
  if(!req.file || req.file.length === 0){
    new Rusult('上传电子书失败').fail(res)
  }else{
    const book = new Book(req.file)
    book.parse().then(book => {
      console.log('112321' + JSON.stringify(book,null,4))
      new Rusult('上传电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
    
  }
})

module.exports = router