const Book = require('../models/Book')
const db = require('../db')
const constant = require('../utils/constant')
const { constants } = require('crypto')
const { json } = require('express')
const _ = require('lodash')
const { resolve } = require('path')
const { reject } = require('lodash')

function exists (book) {
  const { title, author, publisher } = book
  const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
  return db.queryOne(sql)
}

async function removeBook (book) {
  if(book){
    book.reset()
    if(book.fileName){
      const removeBookSql = `delete from book where fileName='${book.fileName}'`
      const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
      await db.querySql(removeBookSql)
      await db.querySql(removeContentsSql)
    }
  }
}

//创建电子书目录
async function insertContents (book) {
  const contents = book.getContents()
  if(contents && contents.length){
    for(let i = 0; i< contents.length; i++) {
      const content = contents[i]
      const _content = _.pick(content, [
        'fileName',
        'id',
        'href',
        'order',
        'level',
        'label',
        'pid',
        'navId'
      ])
      //console.log(_content)
      await db.insert(_content, 'contents')
    }
  }
  return true
}

function insertBook(book){
  return new Promise(async (resolve,reject) => {
    try{
      if(book instanceof Book){
        const result = await exists(book)
        if(result){
          await removeBook(book)
          reject(new Error('电子书已经存在'))
        }else {
          await db.insert(book.toDb(), 'book')
          await insertContents(book)
          resolve()
        }
      }else{
        reject(err)
      }
    } catch(err){
      reject(err)
    }
  })
}

function getBook(fileName) {
  return new Promise((resolve,reject) => {
    resolve({fileName})
  })
}

module.exports = {
  insertBook,
  getBook
}