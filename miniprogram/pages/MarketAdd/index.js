Page({
  //保存正在编辑的商品
  data: {
    title: '',
    desc: '',
    credit: 0,
    maxCredit: getApp().globalData.maxCredit,
    presetIndex: 0,
    image: '',
    imagePreview: '',
    uploading: false,
    presets: [{
        name:"无预设",
        title:"",
        desc:"",
    },{
        name:"薯片",
        title:"美味薯片",
        desc:"诱人的零食，夜宵绝佳伴侣，咔嘣脆！凭此商品可以向对方索要薯片。",
    },{
        name:"奶茶券",
        title:"奶茶权限",
        desc:"凭此券可以向对方索要一杯奶茶。",
    },{
        name:"夜宵券",
        title:"夜宵放开闸",
        desc:"凭此券可以让自己在夜里狂野干饭。",
    },{
        name:"洗碗券",
        title:"洗碗券",
        desc:"凭此券可以让对方洗碗一次！若都有洗碗券则互相抵消。",
    },{
        name:"做家务",
        title:"家务券",
        desc:"凭此券可以让对方做一次轻型家务，比如扔垃圾，打扫一个的房间，领一天外卖什么的。",
    },{
        name:"不赖床",
        title:"早起券",
        desc:"凭此券可以让对方早起床一次。熬夜对身体很不好，还是要早点睡觉第二天才能有精神！",
    },{
        name:"做运动",
        title:"减肥券",
        desc:"凭此券可以逼迫对方做一次运动，以此来达到减肥维持健康的目的。",
    },{
        name:"给饭吃",
        title:"饭票",
        desc:"凭此券可以让对方做一次或请一次饭，具体视情况而定。",
    },{
        name:"买小礼物",
        title:"小礼物盒",
        desc:"凭此券可以让对方买点小礼物，像泡泡马特什么的。",
    },{
        name:"跑腿",
        title:"跑腿召唤",
        desc:"凭此券可以让对方跑腿一天，拿外卖，拿零食，开空调，开电视，在所不辞。",
    }],
    list: getApp().globalData.collectionMarketList,
  },

  //数据输入填写表单
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },
  onDescInput(e) {
    this.setData({
      desc: e.detail.value
    })
  },
  onCreditInput(e) {
    this.setData({
      credit: e.detail.value
    })
  },
  async onChooseImage() {
    if (this.data.uploading) return
    const that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success(res) {
        const filePath = res.tempFilePaths[0]
        console.log('选择图片临时路径:', filePath)
        const extMatch = filePath.match(/\.[^.]+$/)
        const ext = extMatch ? extMatch[0] : '.jpg'
        const cloudPath = `market/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
        console.log('开始上传到云存储:', { cloudPath, filePath })
        that.setData({ uploading: true })
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success(up) {
            console.log('上传成功，返回：', up)
            that.setData({ image: up.fileID })
            wx.cloud.getTempFileURL({ fileList: [up.fileID] }).then(r => {
              const f = r.fileList && r.fileList[0]
              if (f && f.tempFileURL) {
                console.log('获取临时展示链接成功:', f.tempFileURL)
                that.setData({ imagePreview: f.tempFileURL })
              }
            })
            wx.showToast({ title: '图片已上传', icon: 'success', duration: 1500 })
            console.log('图片已上传，fileID 已写入待保存数据（this.data.image），将在保存商品时入库')
          },
          fail() {
            console.error('图片上传失败')
            wx.showToast({ title: '上传失败', icon: 'error', duration: 2000 })
          },
          complete() {
            that.setData({ uploading: false })
          }
        })
      }
    })
  },
  onRemoveImage() {
    if (this.data.uploading) return
    this.setData({ image: '', imagePreview: '' })
  },
  onPresetChange(e){
    this.setData({
      presetIndex: e.detail.value,
      title: this.data.presets[e.detail.value].title,
      desc: this.data.presets[e.detail.value].desc,
    })
  },

//保存商品
async saveItem() {
  // 1. 校验逻辑 (保持不变)
  if (!this.data.image) {
    wx.showToast({ title: '请先上传图片', icon: 'none' });
    return;
  }
  if (this.data.title === '') {
    wx.showToast({ title: '标题未填写', icon: 'error', duration: 2000 });
    return;
  }
  if (this.data.title.length > 12) {
    wx.showToast({ title: '标题过长', icon: 'error', duration: 2000 });
    return;
  }
  if (this.data.desc.length > 100) {
    wx.showToast({ title: '描述过长', icon: 'error', duration: 2000 });
    return;
  }
  if (this.data.credit <= 0) {
    wx.showToast({ title: '一定要有积分', icon: 'error', duration: 2000 });
    return;
  }

  // 2. 发送请求
  console.log('开始保存商品，入库数据：', this.data)
  
  // 获取集合名称 (防止 globalData 偶尔读不到，做个保底)
  const collectionName = getApp().globalData.collectionMarketList || 'market'; 

  await wx.cloud.callFunction({
    name: 'addElement',
    data: {
      // --- 核心修改：添加下面这一行 ---
      list: collectionName,  // 告诉云函数往哪个集合存！
      // -----------------------------
      title: this.data.title,
      desc: this.data.desc,
      credit: Number(this.data.credit), // 建议转成数字，防止输入框传来的是字符串
      image: this.data.image,         
      imageUrl: this.data.imagePreview 
    }
  })
  .then((res) => {
      console.log('保存商品成功，返回：', res && res.result)
      wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1000
      })
      setTimeout(function () {
          wx.navigateBack()
      }, 1000)
  })
  .catch((err) => {
      console.error('保存商品失败：', err)
      // 这里可以把 err 打印出来看更详细的
      wx.showToast({ title: '保存失败', icon: 'error', duration: 2000 })
  })
},

  // 重置所有表单项
  resetItem() {
    this.setData({
      title: '',
      desc: '',
      credit: 0,
      presetIndex: 0,
      image: '',
      imagePreview: '',
      list: getApp().globalData.collectionMarketList,
    })
  }
})
