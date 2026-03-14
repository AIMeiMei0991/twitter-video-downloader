# X 视频下载工具

一个用于下载 X (Twitter) 视频的网页应用，支持批量下载和分辨率选择。

## 功能特点

- 📥 支持批量下载多个 X/Twitter 视频
- 🎬 自动解析视频的不同分辨率
- 📊 实时显示下载进度和速度
- 🎨 Vercel 风格的标题动画效果
- 📱 响应式设计，支持移动端

## 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **后端**：Node.js, Express
- **依赖**：axios, cheerio, puppeteer

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/[your-username]/twitter-video-downloader.git
cd twitter-video-downloader
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动

## 使用方法

1. **复制链接**：在 X/Twitter 上找到包含视频的推文，点击"分享"复制链接
2. **粘贴解析**：将链接粘贴到输入框，支持一次粘贴多个链接（每行一个）
3. **选择画质**：解析完成后选择视频画质
4. **点击下载**：点击下载按钮即可保存到本地

## 支持的链接格式

- `https://x.com/用户名/status/推文ID`
- `https://twitter.com/用户名/status/推文ID`

## 项目结构

```
twitter-video-downloader/
├── public/             # 前端代码
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── app.js          # 前端JavaScript
├── server.js           # 后端服务器
├── get-video-url.js    # 视频URL获取脚本
├── package.json        # 项目配置
└── .gitignore          # Git忽略文件
```

## 部署选项

### Vercel

1. 登录 Vercel 账号
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 点击 "Deploy"

### Heroku

1. 登录 Heroku 账号
2. 点击 "New" > "Create new app"
3. 连接你的 GitHub 仓库
4. 点击 "Deploy Branch"

### Netlify

1. 登录 Netlify 账号
2. 点击 "Add new site" > "Import an existing project"
3. 选择你的 GitHub 仓库
4. 点击 "Deploy site"

## 注意事项

- 本工具仅供个人使用，请勿用于商业用途
- 请遵守 X/Twitter 的使用条款和相关法律法规
- 下载的视频版权归原作者所有

## 许可证

MIT License
