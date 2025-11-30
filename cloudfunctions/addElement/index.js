const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 注意这里：改成了标准的 (event, context)
exports.main = async (event, context) => {
  // 打印日志，方便你在云端控制台调试
  console.log('云函数接收到的 event:', event)

  return await db.collection(event.list).add({
    data: {
      _openid: cloud.getWXContext().OPENID,
      date: db.serverDate(),
      
      // 注意：这里全部从 event 中获取数据
      credit: Number(event.credit),
      title: event.title,
      desc: event.desc,
      
      // 核心字段：确保这里写了
      image: event.image,
      imageUrl: event.imageUrl,

      available: true,
      star: false
    }
  })
}