# PhotoBlock

> 开发模式：**VibeCoding**

摄影作品集网站演示模板。前端保留原有 React UI，后端使用
Cloudflare Workers、D1 和阿里云 OSS。

## VibeCoding

本项目以 VibeCoding 方式完成需求拆解、代码迭代、问题诊断、测试和部署。开发过程结合自然语言需求、AI 辅助实现、人工验收以及类型检查、Lint、生产构建和真实运行验证。

完整开发过程见 [项目开发日志.md](./项目开发日志.md)。

## 当前状态

- React 页面、暗房夜金视觉和交互动效保持不变。
- 首页、关于、合作和个人资料从 D1 动态读取。
- 源码包不包含真实个人资料、作品素材或正式域名配置，默认使用演示内容。
- 管理后台支持作品、系列、分类、轮播图和动态文案管理。
- 图片上传至阿里云 OSS，并通过 `/media/*` 或自定义媒体域名访问。
- 管理接口支持 Cloudflare Access 与 HttpOnly Cookie 两种鉴权方式。
- Worker 提供 `/sitemap.xml`、`/robots.txt` 和安全响应头。
- 入场、页面切换和点击分别使用独立音频策略，并支持全局静音。

脱敏替换项和部署前操作见 [DEMO_CONTENT.md](./DEMO_CONTENT.md)。

## Cloudflare 本地启动

1. 安装项目依赖：

   ```powershell
   pnpm install --frozen-lockfile
   ```

2. 创建 Cloudflare 资源：

   ```powershell
   pnpm exec wrangler d1 create photoblock
   ```

3. 把 D1 返回的 `database_id` 写入 `wrangler.jsonc`。

4. 创建本地配置并填写阿里云 OSS RAM 凭证：

   ```powershell
   Copy-Item .dev.vars.example .dev.vars
   ```

   本地开发使用 `.dev.vars` 中的 `ALIYUN_OSS_*` 配置。
   AccessKey 只使用 RAM 子账号，不要提交到仓库。

5. 初始化本地 D1 并启动：

   ```powershell
   pnpm run build:cf
   pnpm run cf:migrate:local
   pnpm run cf:dev
   ```

健康检查地址为 `http://localhost:8787/api/health`。

音频资源位于 `client/public/audio/`：

- `gallery-intro.mp3`：入场氛围音，并截取前段用于页面切换。
- `shutter.mp3`：所有用户点击的快门声。

浏览器可能因自动播放策略拦截首次入场音；用户首次交互后，点击和页面切换音效可正常播放。

管理页地址是 `http://localhost:8787/admin`。首次登录使用 `.dev.vars` 中的
`ADMIN_BOOTSTRAP_USERNAME` 和 `ADMIN_BOOTSTRAP_PASSWORD`。
第一次成功登录后会创建 PBKDF2 密码哈希，之后不再依赖初始密码。

## 部署

```powershell
pnpm run build:cf
pnpm run cf:migrate:remote
pnpm run cf:deploy
```

Cloudflare Workers Builds 建议配置：

```text
安装命令：pnpm install --frozen-lockfile
构建命令：pnpm run build:cf
部署命令：pnpm exec wrangler deploy
```

生产密钥通过 Wrangler 配置，不要写进仓库：

```powershell
pnpm exec wrangler secret put ADMIN_BOOTSTRAP_PASSWORD
pnpm exec wrangler secret put VIEW_HASH_SECRET
pnpm exec wrangler secret put CF_ACCESS_AUD
pnpm exec wrangler secret put CF_ACCESS_TEAM_DOMAIN
pnpm exec wrangler secret put ALIYUN_OSS_ACCESS_KEY_ID
pnpm exec wrangler secret put ALIYUN_OSS_ACCESS_KEY_SECRET
```

## Cloudflare Access

域名接入 Cloudflare 后，创建两个 Self-hosted Access 应用：

- `demo.example.com/admin*`
- `demo.example.com/api/admin/*`

只允许站点管理员邮箱访问。游客访问首页、作品页和公开 API
时不会被要求登录。

`CF_ACCESS_AUD` 为 Access 应用的 Audience Tag；
`CF_ACCESS_TEAM_DOMAIN` 为 Cloudflare Zero Trust 团队域名。
未配置 Access 时，后台仍可使用安全的账号密码登录。

上线前必须完成：

- 把 `wrangler.jsonc` 中的占位 D1 ID 替换为真实 ID。
- 在阿里云 OSS 中配置 CORS、RAM 子账号和私有 Bucket。
- CDN 配置完成后，将 `MEDIA_BASE_URL` 替换为实际媒体域名。
- 在 Cloudflare 控制台配置 `/admin` 与 `/api/admin/*` 的 Access 策略。
- 首次登录后上传正式作品与个人资料。

## 安全

不要提交 `.env`、`.dev.vars` 或 Cloudflare API Token。
旧后端管理员密码通过 `ADMIN_BOOTSTRAP_PASSWORD` 环境变量初始化，
不再创建固定默认密码。

## 开源许可

本项目基于 [MIT License](./LICENSE) 开源，可以自由使用、复制、修改、合并、发布、分发、再许可和销售软件的副本。

使用第三方依赖时，仍需遵守各依赖自身的许可证；演示占位内容不构成对任何真实人物、作品或品牌授权的替代。
