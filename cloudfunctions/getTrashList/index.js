// 云函数：getTrashList —— 知识库列表接口
// 查询 trash_data 集合,自动拼接 color/bgColor/categoryName/catEmoji 字段
const cloud = require('wx-server-sdk')
const { decorate } = require('./category')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  let { cat } = event
  let where = {}
  if (cat) where.category = cat

  try {
    let res = await db.collection('trash_data').where(where).get()
    let list = res.data.map(item => decorate(item))
    return { list }
  } catch (e) {
    return { list: [] }
  }
}
