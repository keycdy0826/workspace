Page({
  // 保存商品的 _id 和详细信息
  data: {
    _id: '',
    item: null,
    dateStr: '',
    timeStr: '',
    creditPercent: 0,
    image: '',
    imagePreview: '',
    from: '',
    to: '',
    maxCredit: getApp().globalData.maxCredit,
    list: getApp().globalData.collectionMarketList,
  },

  onLoad(options) {
    // 保存上一页传来的 _id 字段，用于查询商品
    if (options.id !== undefined) {
      this.setData({
        _id: options.id
      })
    }
  },
  
  getDate(dateStr){
    const milliseconds = Date.parse(dateStr)
    const date = new Date()
    date.setTime(milliseconds)
    return date
  },

  // 根据 _id 值查询并显示商品
  async onShow() {
    if (this.data._id.length > 0) {
      // 根据 _id 拿到商品
      await wx.cloud.callFunction({name: 'getElementById', data: this.data}).then(async data => {
        // 将商品保存到本地，更新显示
        const item = data.result.data[0]
        if (item && item.image && !item.imageUrl) {
          await wx.cloud.getTempFileURL({ fileList: [item.image] }).then(res => {
            const f = res.fileList && res.fileList[0]
            if (f && f.tempFileURL) item.imageUrl = f.tempFileURL
          })
        }
        this.setData({
          item,
          dateStr: this.getDate(item.date).toDateString(),
          timeStr: this.getDate(item.date).toTimeString(),
          creditPercent: (item.credit / getApp().globalData.maxCredit) * 100,
        })

        //确定商品关系并保存到本地
        if(this.data.item._openid === getApp().globalData._openidA){
          this.setData({
            from: getApp().globalData.userA,
            to: getApp().globalData.userB,
          })
        }else if(this.data.item._openid === getApp().globalData._openidB){
          this.setData({
            from: getApp().globalData.userB,
            to: getApp().globalData.userA,
          })
        }
      })
    }
  },
})
