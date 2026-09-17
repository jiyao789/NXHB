/*
 * @Author: cwkl123 1297224582@qq.com
 * @Date: 2026-09-17 16:52:13
 * @LastEditors: cwkl123 1297224582@qq.com
 * @LastEditTime: 2026-09-17 17:01:20
 * @FilePath: \NXHB\nuanxinyunchao\admin\pages-sub\about\webview.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
'use strict'
const PROTOCOL_DATA = {
  service: {
    title: '用户协议',
    date: '2026-08-09',
    version: '2026.V2',
    content: `
    <div style="font-family: sans-serif; color: #4b5563; line-height: 1.8; font-size: 14px;">
      <div style="background-color: #fff9f5; padding: 15px; border-radius: 8px; border: 1px solid #ffede0; color: #d97706; margin-bottom: 20px; font-size: 13px;">
        <b style="color: #1f2937;">【特别提示】</b>
        欢迎使用暖心云巢管理端小程序（以下简称“本平台”）。本平台由上海市长宁区党建服务中心运营，专为街道办、党群中心、管理人员等运营管理主体提供服务。在您登录及使用本平台各项服务前，请认真阅读本用户协议全部条款。<b style="color: #1f2937;">您登录并使用本平台服务，即表示您已阅读、理解并自愿同意接受本协议全部条款约束。若您不同意本协议任意内容，请立即停止使用本平台。</b>
      </div>
    
      <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">一、协议定义与适用范围</h2>
      <p style="margin-bottom: 12px; text-align: justify;">1、本协议是平台运营方与管理端用户之间，就登录、使用暖心云巢管理端小程序各项服务所订立的合法有效合约。</p>
      <p style="margin-bottom: 12px; text-align: justify;">2、本协议适用于平台全部功能服务，包括账号登录、运营管理、审核监督、数据统计查看等所有管理场景。</p>
      <p style="margin-bottom: 12px; text-align: justify;">3、《暖心云巢管理端小程序隐私政策》为本协议不可分割的组成部分，您使用本平台服务即视为同时同意隐私政策全部约定。</p>
    
      <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">二、平台服务内容</h2>
      <p style="margin-bottom: 12px; text-align: justify;">1、账号基础服务：提供管理账号登录、个人资料查看等基础功能。</p>
      <p style="margin-bottom: 12px; text-align: justify;">2、数据看板服务：提供多维度数据查看、运营概况分析及可视化看板展示。</p>
      <p style="margin-bottom: 12px; text-align: justify;">3、审核管理服务：支持对服务商、内容、活动的线上审核与管理流程。</p>
    
      <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">三、账号管理与使用规范</h2>
      <p style="margin-bottom: 12px; text-align: justify;">1、本平台账号仅限授权的管理人员本人使用，严禁转借、出租、出售给无关第三方。</p>
      <p style="margin-bottom: 12px; text-align: justify;">2、您需妥善保管账号登录信息，如发现账号异常登录应第一时间修改密码并联系平台处理。</p>
    
      <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">四、免责声明与协议修订</h2>
      <p style="margin-bottom: 12px; text-align: justify;">1、平台可根据业务发展及监管需求，适时修订本协议并在小程序内公示。</p>
      <p style="margin-bottom: 12px; text-align: justify;">2、联系电话：22050147。</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: right; color: #9ca3af;">
        <p>版权所有©【上海市长宁区党建服务中心】</p>
        <p>2026年08月09日</p>
      </div>
    </div>`,
  },
  privacy: {
    title: '隐私政策',
    date: '2026-08-09',
    version: '2026.V2',
    content: `
      <div style="font-family: sans-serif; color: #4b5563; line-height: 1.8; font-size: 14px;">
        <div style="background-color: #fff9f5; padding: 15px; border-radius: 8px; border: 1px solid #ffede0; color: #d97706; margin-bottom: 20px; font-size: 13px;">
          <b style="color: #1f2937;">【特别提示】</b>
          欢迎使用暖心云巢管理端小程序（以下简称“本平台”）。本平台由上海市长宁区党建服务中心运营，专为运营管理人员提供服务。在您登录及使用本平台各项服务前，请认真阅读本隐私协议全部条款。<b style="color: #1f2937;">您登录并使用本平台服务，即表示您已阅读、理解并自愿同意接受本隐私协议全部约束条款。</b>
        </div>
      
        <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">一、我们如何收集和使用信息</h2>
        <p style="margin-bottom: 12px; text-align: justify;">1. <b style="color: #1f2937;">账号登录信息：</b>我们会收集您的登录账号与日志信息，用于身份识别及安全防护。</p>
        <p style="margin-bottom: 12px; text-align: justify;">2. <b style="color: #1f2937;">设备与日志信息：</b>收集登录设备型号、IP地址、操作日志，保障管理系统安全稳定运转。</p>
      
        <h2 style="font-size: 16px; font-weight: bold; color: #111827; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #ff6b00; padding-left: 10px;">二、联系我们</h2>
        <p style="margin-bottom: 12px; text-align: justify;">若您对本隐私政策有任何疑问或建议，可联系我们：22050147。</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: right; color: #9ca3af;">
          <p>版权所有©【上海市长宁区党建服务中心】</p>
          <p>2026年08月09日</p>
        </div>
      </div>`,
  },
}

Page({
  data: {
    safeAreaTop: 20,
    pageConfig: {
      title: '',
      date: '',
      version: '',
      content: '',
    },
  },
  onLoad(options) {
    const sysInfo = wx.getSystemInfoSync()
    this.setData({ safeAreaTop: sysInfo.safeArea ? sysInfo.safeArea.top : 20 })
    const type = options.type || 'service'
    const data = PROTOCOL_DATA[type]
    if (data) {
      this.setData({ pageConfig: data })
    }
  },
  handleBack() {
    wx.navigateBack()
  },
})
