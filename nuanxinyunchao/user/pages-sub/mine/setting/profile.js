'use strict'
const auth_1 = require('../../../api/auth')
const env_1 = require('../../../utils/env')
const token_1 = require('../../../utils/token')

Page({
  data: {
    safeAreaTop: 20,
    isEditing: false,
    userInfo: {},
    profileList: [],
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20 })
    this.initUserInfo()
  },

  initUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const profileList = [
      {
        id: 'certValidity',
        label: '资格证件有效期',
        value: userInfo.certValidity || '2030-10-15',
        disabled: true,
      },
      { id: 'phone', label: '手机号', value: userInfo.phone || '' },
      { id: 'birthday', label: '生日', value: userInfo.birthday || '' },
      { id: 'homeAddress', label: '常住地', value: userInfo.homeAddress || '' },
      { id: 'signature', label: '个性介绍', value: userInfo.signature || '' },
    ]
    this.setData({
      userInfo,
      profileList,
    })
  },

  handleBack() {
    wx.navigateBack()
  },

  toggleEdit() {
    this.setData({ isEditing: true })
  },

  onInput(e) {
    const index = e.currentTarget.dataset.index
    const key = `profileList[${index}].value`
    this.setData({ [key]: e.detail.value })
  },

  onDateChange(e) {
    const index = e.currentTarget.dataset.index
    const key = `profileList[${index}].value`
    this.setData({ [key]: e.detail.value })
  },

  validateForm() {
    const list = this.data.profileList
    for (const item of list) {
      if (item.label === '联系手机' && item.value) {
        const phoneReg = /^1[3-9]\d{9}$/
        if (!phoneReg.test(item.value)) {
          wx.showToast({ title: '手机号格式不正确', icon: 'none' })
          return false
        }
      }
    }
    return true
  },

  saveProfile() {
    if (!this.validateForm()) return

    const list = this.data.profileList
    const phone = list.find((i) => i.id === 'phone').value

    // 手机号格式校验
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }

    wx.showLoading({ title: '正在保存...' })

    const updateParam = {
      avatar: this.data.userInfo.avatar,
      phone: list.find((i) => i.id === 'phone').value,
      birthday: list.find((i) => i.id === 'birthday').value,
      homeAddress: list.find((i) => i.id === 'homeAddress').value,
      signature: list.find((i) => i.id === 'signature').value,
      certValidity: list.find((i) => i.id === 'certValidity').value,
    }

    ;(0, auth_1.updateUserInfoApi)(updateParam)
      .then(() => {
        return (0, auth_1.getLoginUserInfoApi)()
      })
      .then((newUserInfo) => {
        wx.hideLoading()
        wx.setStorageSync('userInfo', newUserInfo)
        this.setData({ isEditing: false })
        this.initUserInfo()
        wx.showToast({ title: '修改成功', icon: 'success' })
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('保存失败', err)
      })
  },

  // 上传单张图片到服务器本地存储（无需token）
  uploadSingleImage(filePath) {
    return new Promise((resolve, reject) => {
      const bizUrl = (0, env_1.getBizUrl)()

      // 上传到本地存储
      const uploadUrl = bizUrl + '/dev/file/upload'

      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        header: {},
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            console.log('上传图片返回数据', data.data.downloadPath)
            const result = data.data.downloadPath.replace(/^https?:\/\/[^\/]+/, '')
            console.log('上传图片地址', bizUrl + result)
            const url = bizUrl + result
            if (data.code === 200 || data.code === 0) {
              resolve(url)
            } else {
              reject(data)
            }
          } catch (e) {
            reject(e)
          }
        },
        fail: (err) => {
          reject(err)
        },
      })
    })
  },

  editAvatar() {
    if (!this.data.isEditing) return
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.showLoading({ title: '上传中...' })

        try {
          const imageUrl = await this.uploadSingleImage(tempFilePath)
          this.setData({ 'userInfo.avatar': imageUrl })
          wx.hideLoading()
          wx.showToast({ title: '头像上传成功', icon: 'success' })
        } catch (err) {
          wx.hideLoading()
          console.error('头像上传失败', err)
          wx.showToast({ title: '头像上传失败', icon: 'none' })
        }
      },
    })
  },
})
