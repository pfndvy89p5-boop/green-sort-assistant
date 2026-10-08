// ============================================================
// 百度AI 配置
// 说明：密钥从云函数环境变量读取，禁止硬编码！
//       在云开发控制台 → 函数 → 配置 → 环境变量 里设置：
//       BAIDU_API_KEY  和  BAIDU_SECRET_KEY
// 申请地址：https://console.bce.baidu.com/ai/#/ai/imageclassify/app/list
// ============================================================
module.exports = {
  // 百度智能云 API Key（从环境变量读取）
  API_KEY: process.env.BAIDU_API_KEY || '',
  // 百度智能云 Secret Key（从环境变量读取）
  SECRET_KEY: process.env.BAIDU_SECRET_KEY || '',
  // 获取 access_token 的地址
  TOKEN_URL: 'https://aip.baidubce.com/oauth/2.0/token',
  // 通用物体识别 API 地址
  API_URL: 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general'
}
