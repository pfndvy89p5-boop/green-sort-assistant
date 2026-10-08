# 绿分类助手 v3.0 — 毕业设计全栈项目

> ⚠️ **2026-09-01 已按《部署手册》全量重建**：7页结构（index/knowledge/result/camera/search/collect/mine）、系统原生tabBar、主色 #27C48D、分类底色 rgba 0.18、卡片24rpx圆角、数据库 **trash_data**、云函数 **getTrashList/searchTrash**。种子数据见 `database/trash_data_seed.json`。

> 基于微信小程序 + 微信云开发的垃圾分类识别管理系统
> 学生：兰哲 ｜ 网络工程 ｜ 成都文理学院

---

## 一、项目概述

本系统包含 **微信小程序用户端**、**微信云开发服务层** 与 **H5 管理员后台** 三大部分：

| 模块 | 说明 |
|------|------|
| 小程序用户端 | 6 个页面：启动页、首页、识别结果页、知识库、收藏、个人中心 |
| 云开发服务层 | 15 个云函数：5 个用户业务 + 1 个百度AI识别 + 10 个管理员后台 |
| H5 管理员后台 | 5 个静态页面：登录、控制台、物品管理、反馈管理、数据统计 |

核心功能：**拍照识别 + 文字查询垃圾分类**（本地数据库优先，百度AI 兜底）、知识库浏览、收藏、用户反馈、后台数据管理。

---

## 二、页面截图

> 截图存放于 `docs/screenshots/` 目录。

### 小程序用户端

| 首页 | 搜索页 |
|:---:|:---:|
| ![首页](docs/screenshots/home.png) | ![搜索页](docs/screenshots/search.png) |

| 识别结果 | 知识库 |
|:---:|:---:|
| ![识别结果](docs/screenshots/result.png) | ![知识库](docs/screenshots/knowledge.png) |

| 收藏 | 个人中心 |
|:---:|:---:|
| ![收藏](docs/screenshots/collect.png) | ![个人中心](docs/screenshots/mine.png) |

### H5 管理员后台

| 登录页 | 数据概览 |
|:---:|:---:|
| ![登录页](docs/screenshots/admin-login.png) | ![数据概览](docs/screenshots/admin-dashboard.png) |

| 物品管理 | 反馈管理 |
|:---:|:---:|
| ![物品管理](docs/screenshots/admin-goods.png) | ![反馈管理](docs/screenshots/admin-feedback.png) |

---

## 三、项目目录说明

```
绿分类助手_v3/
├── project.config.json          # 微信开发者工具项目配置（AppID: wxb778b33cd07c2223）
├── README.md                    # 本文档
│
├── miniprogram/                 # 小程序用户端
│   ├── app.js                   # 全局逻辑（云开发初始化、状态栏高度）
│   ├── app.json                 # 全局配置（6页面 + 自定义tabBar）
│   ├── app.wxss                 # 全局样式（设计变量、图标规范、公共类）
│   ├── sitemap.json
│   ├── images/icons/            # 12 张线性图标（白色线条 + filter变色）
│   ├── custom-tab-bar/          # 自定义底部导航（首页/知识库/收藏/我的）
│   └── pages/
│       ├── splash/              # 启动页（3秒自动跳转首页）
│       ├── index/               # 首页（搜索/拍照/文字查询/四分类/最近查询）
│       ├── result/              # 识别结果页（本地DB优先 + 百度AI兜底）
│       ├── knowledge/           # 知识库页（四分类切换 + 物品列表）
│       ├── collect/             # 收藏页
│       └── my/                  # 个人中心（菜单 + 意见反馈表单）
│
├── cloudfunctions/              # 云开发云函数（共16个目录）
│   ├── getTrashByName/          # [用户] 按名称查询垃圾物品
│   ├── toggleCollect/           # [用户] 收藏/取消收藏
│   ├── getCollectList/          # [用户] 获取收藏列表
│   ├── getKnowledgeList/        # [用户] 获取知识库列表
│   ├── submitFeedback/          # [用户] 提交反馈
│   ├── baiduWasteIdentify/      # [百度AI] 图像识别（config.js 存放密钥）
│   ├── adminLogin/              # [管理] 登录生成token
│   ├── adminGetDashboard/       # [管理] 控制台数据概览
│   ├── adminGetGoodsList/       # [管理] 物品列表（搜索+分页）
│   ├── adminAddGoods/           # [管理] 新增物品
│   ├── adminUpdateGoods/        # [管理] 编辑物品
│   ├── adminDeleteGoods/        # [管理] 删除物品
│   ├── adminGetFeedbackList/    # [管理] 反馈列表
│   ├── adminUpdateFeedbackStatus/ # [管理] 标记反馈处理状态
│   ├── adminDeleteFeedback/     # [管理] 删除反馈
│   └── adminGetStats/           # [管理] 数据统计
│
└── adminh5/                     # H5 管理员后台（静态网站托管）
    ├── login.html               # 登录页
    ├── index.html               # 控制台首页
    ├── goods.html               # 物品管理
    ├── feedback.html            # 反馈管理
    ├── stats.html               # 数据统计
    ├── css/admin.css            # 公共样式
    └── js/
        ├── config.js            # API 配置（部署前填写环境ID）
        └── api.js               # 云函数 HTTP 调用封装 + 鉴权
```

---

## 四、云数据库集合（3个，字段定义）

> 集合结构原样保留，字段沿文档定义，不改动。

**trash_goods（垃圾物品库）**
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| name | string | 垃圾名称 |
| category | string | 分类（可回收物/厨余垃圾/有害垃圾/其他垃圾） |
| color | string | 分类颜色（如 #2563EB） |
| desc | string | 物品说明 |
| tip | string | 投放提示 |
| createTime | number | 创建时间戳 |

**user_collect（用户收藏）**
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| _openid | string | 用户标识（云开发自动写入） |
| goodsId | string | 关联 trash_goods 的 _id |
| name / category / color / desc / tip | string | 物品信息快照 |
| createTime | number | 收藏时间戳 |

**feedback（用户反馈）**
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| _openid | string | 用户标识 |
| content | string | 反馈内容 |
| contact | string | 联系方式（选填） |
| status | number | 0未处理 / 1已处理 |
| createTime | number | 提交时间戳 |

---

## 五、部署步骤

### 1. 导入小程序项目
1. 打开微信开发者工具 → 导入项目
2. 目录选择：`D:\绿分类助手_v3`
3. AppID：`wxb778b33cd07c2223`
4. 导入后即可编译预览小程序用户端

### 2. 开通云开发
1. 开发者工具工具栏点「云开发」→ 开通（选择按量付费或免费额度）
2. 记录 **环境 ID**（后续配置使用）

### 3. 创建数据库集合
在云开发控制台 → 数据库 中创建 3 个集合：
- `trash_goods`、`user_collect`、`feedback`

**权限设置**（云开发控制台 → 权限设置）：
- `trash_goods`：所有用户可读（管理端通过云函数读写）→ 自定义规则 `{"read": true, "write": false}` 或「仅创建者可读写」+ 云函数
- `user_collect`：仅创建者可读写（云函数通过 _openid 隔离）
- `feedback`：仅创建者可读写（云函数写入）

> 建议：将 3 个集合权限均设为「仅云函数可读写」（管理后台与小程序均通过云函数访问），最安全。

**初始化数据**：在 `trash_goods` 中录入常用垃圾数据（可在 H5 后台「物品管理」页批量新增，或手动导入）。

### 4. 上传部署云函数（16个）
在开发者工具左侧「云开发」→ 云函数 → 对 `cloudfunctions/` 下每个函数：
1. 右键云函数目录 → 上传并部署（云端安装依赖）
2. 逐个部署 16 个云函数

### 5. 配置百度AI（图片识别）
1. 打开 `cloudfunctions/baiduWasteIdentify/config.js`
2. 已配置好 API_KEY / SECRET_KEY（变量引用，不硬编码）
3. 如需更换密钥，直接修改该配置文件即可
4. 重新部署 `baiduWasteIdentify` 云函数生效

### 6. 部署 H5 管理员后台
1. 打开 `adminh5/js/config.js`，将 `YOUR-ENV-ID` 替换为你的云开发**环境 ID**
2. 云开发控制台 → 静态网站托管 → 上传部署 `adminh5/` 目录内容
3. 访问静态托管域名即可打开后台

### 7. 启用云函数 HTTP 访问（管理员后台调用）
H5 后台通过 HTTP 调用云函数，需为 10 个 `admin*` 云函数开启 HTTP 访问：
1. 云开发控制台 → 云函数 → 选中函数 → 配置 → 启用「HTTP 访问」
2. 路径建议保留默认（云函数名）
3. 10 个 admin 函数都需开启：`adminLogin`、`adminGetDashboard`、`adminGetGoodsList`、`adminAddGoods`、`adminUpdateGoods`、`adminDeleteGoods`、`adminGetFeedbackList`、`adminUpdateFeedbackStatus`、`adminDeleteFeedback`、`adminGetStats`

---

## 六、云函数环境变量配置

> ⚠️ **必须配置**：所有密钥已从代码中移除，改为从云函数环境变量读取。不配置会导致管理员后台无法登录、百度AI 识别不可用。

### 配置位置

云开发控制台 → 云函数 → 选中函数 → **配置** → 环境变量 → 添加变量 → 保存 → 重新部署该函数

### 环境变量清单

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `ADMIN_SECRET` | HMAC-SHA256 签名密钥（所有 admin 函数必须一致） | 建议 32 位以上随机字符串，如 `aB3k!9Z#2mM...` |
| `ADMIN_USER` | 管理员账号 | `admin` |
| `ADMIN_PASS` | 管理员密码 | 自己设定的强密码 |
| `BAIDU_API_KEY` | 百度智能云 API Key | 百度智能云控制台获取 |
| `BAIDU_SECRET_KEY` | 百度智能云 Secret Key | 百度智能云控制台获取 |

### 各云函数需要配置的变量

#### 1. `baiduWasteIdentify`（百度AI 图像识别）

| 变量 | 必填 | 说明 |
|------|------|------|
| `BAIDU_API_KEY` | ✅ | 百度智能云 API Key |
| `BAIDU_SECRET_KEY` | ✅ | 百度智能云 Secret Key |

> 申请地址：https://console.bce.baidu.com/ai/#/ai/imageclassify/app/list

#### 2. `adminLogin`（管理员登录）

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_USER` | ✅ | 管理员账号（默认 `admin`） |
| `ADMIN_PASS` | ✅ | 管理员密码 |
| `ADMIN_SECRET` | ✅ | 必须与其他 admin 函数一致 |

#### 3. `adminApiGateway`（管理员 API 网关）

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_USER` | ✅ | 必须与 `adminLogin` 一致 |
| `ADMIN_PASS` | ✅ | 必须与 `adminLogin` 一致 |
| `ADMIN_SECRET` | ✅ | 必须与其他 admin 函数一致 |

#### 4. 以下 12 个 admin 函数（只需配置 `ADMIN_SECRET`）

`ADMIN_SECRET` 必须与上面 `adminLogin`、`adminApiGateway` 设置的**完全相同**，否则 token 校验失败。

| 云函数 | 变量 |
|--------|------|
| `adminAddGoods` | `ADMIN_SECRET` |
| `adminDeleteFeedback` | `ADMIN_SECRET` |
| `adminDeleteGoods` | `ADMIN_SECRET` |
| `adminGetAllHistory` | `ADMIN_SECRET` |
| `adminGetAllPoints` | `ADMIN_SECRET` |
| `adminGetDashboard` | `ADMIN_SECRET` |
| `adminGetFeedbackList` | `ADMIN_SECRET` |
| `adminGetGoodsList` | `ADMIN_SECRET` |
| `adminGetStats` | `ADMIN_SECRET` |
| `adminGetUserList` | `ADMIN_SECRET` |
| `adminUpdateFeedbackStatus` | `ADMIN_SECRET` |
| `adminUpdateGoods` | `ADMIN_SECRET` |

### 配置流程（单个云函数）

1. 云开发控制台 → 云函数 → 点击函数名
2. 「配置」标签 → 环境变量 → 「添加变量」
3. 输入变量名和值 → 保存
4. 重新部署该云函数（右键 → 上传并部署：云端安装依赖）

### 验证

- 管理员登录：H5 后台输入账号密码，能返回 token 即成功
- 百度AI 识别：小程序拍照识别，能返回分类结果即成功

### 管理员账号信息

| 项目 | 值 |
|------|-----|
| 账号 | `ADMIN_USER`（默认 `admin`） |
| 密码 | `ADMIN_PASS` |
| Token 有效期 | 24 小时 |
| 鉴权方式 | HMAC-SHA256 签名，无状态 token |

---

## 七、图标放置说明

图标统一存放于 `miniprogram/images/icons/`（12 张白色线性 PNG，128×128）。

| 图标文件 | 用途 | 使用页面 |
|----------|------|----------|
| home.png | 首页 / 品牌 | 启动页、tabBar 首页 |
| search-doc.png | 查询 / 知识库 | 首页搜索框、文字查询卡片、tabBar 知识库 |
| camera.png | 拍照识别 | 首页拍照卡片、识别结果页 |
| star-collect.png | 收藏 | tabBar 收藏、个人中心收藏菜单 |
| user.png | 我的 / 用户 | tabBar 我的、个人中心头像 |
| setting.png | 设置 | 首页右上角 |
| back.png | 返回 | 识别结果页返回按钮 |
| feedback.png | 意见反馈 | 个人中心反馈菜单 |
| goods-list.png | 物品列表 | 个人中心关于菜单 |
| dashboard.png | 数据面板 | （后台预留） |
| chart-stat.png | 数据图表 | （后台预留） |
| admin-shield.png | 管理员 | （后台预留） |

**图标使用规范：**
- 路径统一使用项目相对路径：`/images/icons/xxx.png`
- 尺寸统一 48rpx，线条颜色通过 CSS filter 控制（主题色 `#34C759`）
- 全局样式类：`.icon-btn`（在 `app.wxss` 中定义）

---

## 八、设计规范（UI 参数）

| 参数 | 值 |
|------|-----|
| 主色调 | `#34C759` |
| 页面背景 | `#F7F9F7` → `#FFFFFF` 渐变 |
| 卡片 | 白色、18rpx 圆角、阴影 `0 2rpx 12rpx rgba(0,0,0,0.04)` |
| 页面边距 | 左右固定 48rpx |
| 图标尺寸 | 48rpx |

---

## 九、注意事项

1. 云函数需逐个部署，首次部署会自动安装 `wx-server-sdk` 依赖
2. H5 后台登录依赖云函数 HTTP 访问，未开启会提示网络错误
3. `trash_goods` 需初始化数据后，知识库与查询功能才有内容
4. 百度AI 识别结果仅供参考，本地数据库匹配结果优先
