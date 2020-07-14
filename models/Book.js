const { MIME_TYPE_EPUB,UPLOAD_URL,UPLOAD_PATH } = require('../utils/constant')
const Epub = require('../utils/epub')
const fs = require('fs')
const { runInThisContext } = require('vm')
const e = require('express')
const { resolve } = require('path')
const { notAcceptable } = require('boom')
const xml2js = require('xml2js').parseString
class Book {
  constructor(file, data){
    if (file) {
      this.createBookFromFile(file)
    }else{
      this.createBookFromData(data)
    }
  }

  createBookFromFile(file) {
    const {
      destination : des,
      filename,
      mimetype = MIME_TYPE_EPUB,
      path
    } = file

    //电子书的文件后缀名
    const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
    //电子书的原有路径
    const oldBookPath = path
    //电子书的新路径 主要给电子书加上.epub 后缀
    const bookPath = `${des}/${filename}${suffix}`
    //电子书的下载url
    const url = `${UPLOAD_URL}/book/${filename}${suffix}`
    // 电子书的解压路径
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    //电子书的解压后的文件夹url 
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
    if (!fs.existsSync(unzipPath)) {
      fs.mkdirSync(unzipPath, { recursive: true }) // 创建电子书解压后的目录
    }
    if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath, bookPath) // 重命名文件
    }
    this.fileName = filename // 文件名
    this.path = `/book/${filename}${suffix}` // epub文件路径
    this.filePath = this.path // epub文件路径
    this.url = url // epub文件url
    this.title = '' // 标题
    this.author = '' // 作者
    this.publisher = '' // 出版社
    this.contents = [] // 目录
    this.cover = '' // 封面图片URL
    this.coverPath = '' // 封面图片路径
    this.category = -1 // 分类ID
    this.categoryText = '' // 分类名称
    this.language = '' // 语种
    this.unzipPath = `/unzip/${filename}` // 解压后的电子书目录
    this.unzipUrl = unzipUrl // 解压后的电子书链接
    this.originalName = file.originalname
  }
  createBookFromData(data) {
    this.fileName = data.fileName
    this.cover = data.coverPath
    this.title = data.title
    this.author = data.author
    this.publisher = data.publisher
    this.bookId = data.fileName
    this.language = data.language
    this.rootFile = data.rootFile
    this.originalName = data.originalName
    this.path = data.path || data.filePath
    this.filePath = data.path || data.filePath
    this.unzipPath = data.unzipPath
    this.coverPath = data.coverPath
    this.createUser = data.username
    this.createDt = new Date().getTime()
    this.updateDt = new Date().getTime()
    this.updateType = data.updateType === 0 ? data.updateType : UPDATE_TYPE_FROM_WEB
    this.contents = data.contents
  }
  parse() {
    return new Promise((resolve,reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      if(!fs.existsSync(bookPath)){
        reject(new Error('电子书不存在'))
      }else{
        const epub = new Epub(bookPath)
        epub.on('error', err => {
          reject(err)
        })
        epub.on('end', err => {
          if(err){
            reject(err)
          }else{
            //console.log(epub.metadata)
            const {
              language,
              creator,
              creatorFileAs,
              title,
              cover,
              publisher,
            } = epub.metadata
            if(!title){
              reject(new Error('图书标题为空'))
            }else{
              this.title = title
              this.language = language || 'en'
              this.author = creator || creatorFileAs || 'unknown'
              this.publisher = publisher || 'unknown'
              this.rootFile = epub.rootFile

              try{
                this.unzip()
                this.parseContents(epub).then(({chapters}) => {
                  this.contents = chapters
                  epub.getImage(cover,handleGetImage)
                })
              }catch(err){
                reject(err)
              }
              const handleGetImage = (err,file,mimetype) => {
               // file data对象
               if(err){
                 reject(err)
               }else{
                const suffix = mimetype.split('/')[1]
                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                this.coverPath = `img/${this.fileName}.${suffix}`
                this.coverUrl = coverUrl
                fs.writeFileSync(coverPath,file,'binary')
                resolve(this)
               }
              }
            }
          }
        })
        epub.parse()
      }
    })
  }
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path))
    zip.extractAllTo(Book.genPath(this.unzipPath),true)
  }

  parseContents(epub){
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id
      if(ncx){
        return ncx
      }else {
        return manifest[id].href
      }
    }
    function findParent (array,level = 0,pid = '') {
      return array.map(item => {
        item.level = level
        item.pid = pid
        if(item.navPoint && item.navPoint.length){
          item.navPoint = findParent(item.navPoint,level + 1 , item['$'].id)
        }else if(item.navPoint){
          item.navPoint.level = level + 1
          item.navPoint.pid = item['$'].id
        }
        return item
      })
    }
    function flatten (array){
      return [].concat(...array.map(item => {
        if(item.navPoint && item.navPoint.length){
          return [].concat(item, ...flatten(item.navPoint))
        }else if(item.navPoint){
          return [].concat(item,item.navPoint)
        }
        return item
      }))
    }
    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    // console.log(ncxFilePath)
    if(fs.existsSync(ncxFilePath)){
      return new Promise((resolve,reject) => {
        const xml = fs.readFileSync(ncxFilePath,'utf-8')
        const fileName = this.fileName
        xml2js(xml,{
          explicitArray: false,
          ignoreAttrs: false
        },function(err,json){
          if(err){
            reject(err)
          }else{
            // console.log('xml',json)
            const navMap = json.ncx.navMap
            // console.log('mav'+ JSON.stringify(navMap,null,4))
            if(navMap.navPoint && navMap.navPoint.length){
              navMap.navPoint = findParent(navMap.navPoint)
              const newNavMap = flatten(navMap.navPoint)
              const chapters = []
              epub.flow.forEach((chapter,index) => {
                if(index + 1 > newNavMap.length){
                  return 
                }
                const nav = newNavMap[index]
                chapter.text = `${UPLOAD_URL}/unzip/${fileName}/${chapter.href}`
                if(nav && nav.navLabel){
                  chapter.label = nav.navLabel.text || ''
                }else{
                  chapter.label = ''
                }
                chapter.level = nav.level
                chapter.pid = nav.pid
                chapter.navId = nav['$'].id
                chapter.fileName = fileName
                chapter.order = index + 1
                chapters.push(chapter)
              })
             resolve({chapters})
            }else {
              reject(new Error('目录解析失败，目录数为零'))
            }
          }
        })
      })
    }else{
      throw new Error('目录文件不存在!')
    }
  }

  static genPath(path){
    if(!path.startsWith('/')){
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }
}


module.exports = Book