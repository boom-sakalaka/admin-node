const Book = require('../models/Book')
const db = require('../db')
function exists (book) {
  
}

function removeBook (book) {

}

//创建电子书目录
function insertContents (book) {

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
          await db.insert(book, 'book')
          await insertContents(book)
          resolve()
        }
      }else{
        reject(new Error('添加的图书不合法'))
      }
    } catch(err){
      reject(new Error('添加的图书不合法'))
    }
  })
}

module.exports = {
  insertBook
}