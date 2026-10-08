// utils/icons.js —— Neo-Brutalist 纯 SVG 图标库 v2
// 全部 viewport 24x24、stroke-width 2.5、硬拐角、零图片依赖
// 颜色: black(#000) / white(#FFF) / hot(#FF006E) / lime(#CCFF00)

const BLACK = '#000'
const WHITE = '#FFF'
const HOT   = '#FF006E'
const LIME  = '#CCFF00'

// 纯 JS UTF-8 → base64 (小程序兼容,不依赖 Buffer/btoa)
function utf8ToBase64(str) {
  const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bytes = []; let i = 0;
  while (i < str.length) {
    let c = str.charCodeAt(i++);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) { bytes.push(0xc0 | (c >> 6)); bytes.push(0x80 | (c & 0x3f)); }
    else { bytes.push(0xe0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3f)); bytes.push(0x80 | (c & 0x3f)); }
  }
  let out = '';
  for (let j = 0; j < bytes.length; j += 3) {
    let b1 = bytes[j], b2 = bytes[j+1] || 0, b3 = bytes[j+2] || 0;
    out += base64[b1 >> 2];
    out += base64[((b1 & 3) << 4) | (b2 >> 4)];
    out += j+1 < bytes.length ? base64[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    out += j+2 < bytes.length ? base64[b3 & 63] : '=';
  }
  return out;
}

function build(COLOR, svg) {
  const raw = svg.replace(/__S__/g, COLOR).replace(/__F__/g, COLOR)
  return 'data:image/svg+xml;base64,' + utf8ToBase64(raw)
}

// SVG 模板: __S__=stroke 占位, __F__=fill 占位
// 所有图标用纯矩形拼接,零圆角,确保每个形状都清晰不混淆
const T = {
  // 1. 返回箭头: L形 + 横杠
  arrow: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M15 5L6 12L15 19'/><path d='M6 12L21 12'/></svg>`,

  // 2. 搜索: 方镜 + 斜杠
  search: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='4' y='4' width='12' height='12'/><path d='M16 16L22 22'/></svg>`,

  // 3. 相机: 矩形机身 + 方镜头 + 顶部小凸起(闪光灯)
  // 注意:不能画成三角屋顶形状!用纯矩形避免和 home 混淆
  camera: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='2' y='8' width='20' height='14'/><rect x='9' y='13' width='6' height='6'/><rect x='9' y='4' width='6' height='4'/></svg>`,

  // 4. 首页: 三角屋顶 + 方底(和 camera 矩形区分)
  home: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M3 12L12 4L21 12'/><rect x='5' y='12' width='14' height='10'/></svg>`,

  // 5. 书本: 两个相邻矩形
  book: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='4' y='4' width='7' height='16'/><rect x='13' y='4' width='7' height='16'/></svg>`,

  // 6. 收藏: 菱形方框
  star: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M12 3L21 12L12 21L3 12Z'/></svg>`,

  // 7. 收藏实心: 纯填充菱形
  starFilled: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='__F__'><path d='M12 3L21 12L12 21L3 12Z'/></svg>`,

  // 8. 用户: 方头 + 方肩
  user: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='9' y='3' width='6' height='7'/><rect x='4' y='13' width='16' height='8'/></svg>`,

  // 9. 设置: 中心方块 + 四向短杠
  settings: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='8' y='8' width='8' height='8'/><path d='M12 2L12 8M12 16L12 22M2 12L8 12M16 12L22 12'/></svg>`,

  // 10. 气泡: 矩形 + 三角尾巴
  chat: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='3' y='3' width='18' height='14'/><path d='M7 17L5 21L10 17'/></svg>`,

  // 11. 信息: 方点 + 竖杠
  info: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='__F__'><rect x='10' y='4' width='4' height='4'/><rect x='11' y='12' width='2' height='8'/></svg>`,

  // 12. 品牌 Logo: 下方大空心矩形 + 右上小实心矩形
  logo: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><rect x='3' y='9' width='18' height='13'/><rect x='12' y='3' width='8' height='6' fill='__F__'/></svg>`,

  // 13. 可回收物: 上下两条循环半圈 + 方向箭头(全直线硬拐角)
  recycle: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M3 11V5h18'/><path d='M18 2l3 3-3 3'/><path d='M21 13v6H3'/><path d='M6 16l-3 3 3 3'/></svg>`,

  // 14. 厨余垃圾: 八边形苹果身 + 茎叶
  apple: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M8 6h8l3 3v6l-3 3H8l-3-3V9z'/><path d='M12 6V3'/><path d='M12 3l4-1'/></svg>`,

  // 15. 有害垃圾: 线条骷髅头(圆颅骨 + 实心眼窝鼻洞 + 牙床)
  skull: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20'/><path d='M8 20v2h8v-2'/><path d='M10.5 20v2M13.5 20v2'/><circle cx='9.5' cy='11' r='1.4' fill='__F__' stroke='none'/><circle cx='14.5' cy='11' r='1.4' fill='__F__' stroke='none'/><path d='M12 13.5l-1.1 2h2.2z' fill='__F__' stroke='none'/></svg>`,

  // 16. 其他垃圾: 垃圾桶(盖 + 提手 + 桶身 + 双竖纹)
  trash: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='__S__' stroke-width='2.5' stroke-linecap='square' stroke-linejoin='miter'><path d='M3 5h18'/><path d='M8 5V2h8v3'/><path d='M5 5l1 17h12l1-17'/><path d='M10 9v9M14 9v9'/></svg>`
}

function make(COLOR) {
  return {
    arrowLeft:  build(COLOR, T.arrow),
    search:     build(COLOR, T.search),
    camera:     build(COLOR, T.camera),
    home:       build(COLOR, T.home),
    book:       build(COLOR, T.book),
    star:       build(COLOR, T.star),
    starFilled: build(COLOR, T.starFilled),
    user:       build(COLOR, T.user),
    settings:   build(COLOR, T.settings),
    chat:       build(COLOR, T.chat),
    info:       build(COLOR, T.info),
    logo:       build(COLOR, T.logo),
    recycle:    build(COLOR, T.recycle),
    apple:      build(COLOR, T.apple),
    skull:      build(COLOR, T.skull),
    trash:      build(COLOR, T.trash)
  }
}

module.exports = {
  BLACK: make(BLACK),
  WHITE: make(WHITE),
  HOT:   make(HOT),
  LIME:  make(LIME)
}
