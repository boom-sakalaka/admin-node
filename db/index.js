const mysql = require('mysql')
const config = require('./config')
const { debug } = require('../utils/constant')

function connect() {
  return mysql.createConnection({
    ...config,
    multipleStatements: true
  })
}


function querySql (sql){
  const conn = connect()
  //debug && console.log(sql)
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql,(err,results) => {
        if(err){
          //debug && console.log('查询失败，原因:' + JSON.stringify(err))
          reject(err)
        }else{
          //debug && console.log('查询成功', JSON.stringify(results))
          resolve(results)
        }
      })
    }catch(e){
      reject(e)
    }finally{
      conn.end()
    }
  })
}
function queryOne(sql) {
  return new Promise((resolve, reject) => {
    querySql(sql)
      .then(results => {
        if (results && results.length > 0) {
          resolve(results[0])
        } else {
          resolve(null)
        }
      })
      .catch(error => {
        reject(error)
      })
  })
}
function insert()

module.exports = {
  querySql,
  queryOne,
  insert
}