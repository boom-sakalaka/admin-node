const { env } = require('./env')
const UPLOAD_PATH = env === 'dev' ? 'G:/admin-upload-ebook' : '/root/upload/admin-upload/ebook'
const MIME_TYPE_EPUB = 'application/epub+zip'
const UPLOAD_URL = env === 'dev' ? 'https://book.guzhihao.cn/' : 'https://www.guzhihao.cn/'
module.exports = {
  CODE_ERROR: -1,
  CODE_SUCCESS: 0,
  CODE_TOKEN_EXPIRED: -2,
  debug: false,
  PWD_SALT: 'admin_imooc_node',
  PRIVATE_KEY: 'admin_immoc_node_book_guzhihao',
  JWT_EXPIRED: 60*60,
  UPLOAD_PATH,
  MIME_TYPE_EPUB,
  UPLOAD_URL
};
