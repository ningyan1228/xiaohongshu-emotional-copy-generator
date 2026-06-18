# 小红书情绪文案生成器

一个极简 SaaS 风格 MVP：用户输入产品关键词，选择风格后生成 20 条小红书情绪化短文案。

## 项目结构

```text
/frontend
  index.html
  config.js
  app.js
  style.css

/backend
  main.ts
  .env.example
```

## 功能

- 输入产品关键词，例如「护手霜」「零食」「香薰」
- 支持 3 种风格：情绪爆款、夸张种草、求链接风格
- 一次生成 20 条短句
- 每条文案可单独复制
- 前端可部署到 GitHub Pages
- 后端可部署到 Deno Deploy
- API Key 只放在后端环境变量中

## 本地运行前端

直接打开 `frontend/index.html` 即可预览页面。

前端默认会请求：

```text
http://localhost:8000
```

如果已经有线上 Deno Deploy 后端，把 `frontend/config.js` 改成：

```js
window.XHS_API_BASE_URL = "https://xhs-copy-generator.deno.dev";
```

## 本地运行后端

安装 Deno 后，在项目根目录运行：

```bash
cd backend
cp .env.example .env
deno run --allow-net --allow-env --env-file=.env main.ts
```

后端默认监听 Deno 的本地服务地址，并暴露：

```text
POST /api/generate
```

请求示例：

```json
{
  "keyword": "护手霜",
  "style": "emotional"
}
```

响应示例：

```json
{
  "results": ["救命真的离不开", "这手感谁懂啊"]
}
```

## 部署后端到 Deno Deploy

1. 打开 Deno Deploy 并创建新项目。
2. 入口文件选择 `backend/main.ts`。
3. 设置环境变量：

```text
SILICONFLOW_API_KEY=你的 SiliconFlow API Key
SILICONFLOW_MODEL=deepseek-chat
ALLOWED_ORIGIN=https://your-name.github.io
```

4. 部署完成后记录后端地址，例如：

```text
https://xhs-copy-generator.deno.dev
```

## 部署前端到 GitHub Pages

1. 将 `frontend` 目录提交到 GitHub 仓库。
2. 将 `frontend/config.js` 里的后端地址改成你的 Deno Deploy 地址：

```js
window.XHS_API_BASE_URL = "https://xhs-copy-generator.deno.dev";
```

3. 在 GitHub Pages 中选择部署静态文件。

## SiliconFlow

后端调用：

```text
POST https://api.siliconflow.cn/v1/chat/completions
```

默认模型：

```text
deepseek-chat
```

也可通过环境变量 `SILICONFLOW_MODEL` 改成你账户支持的 DeepSeek 模型。
