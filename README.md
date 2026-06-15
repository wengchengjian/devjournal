# devjournal

个人技术博客，基于 Astro 6 构建，中英文混合内容。

部署在 Cloudflare Workers（static assets 模式），使用 D1 数据库 + KV 缓存支持 better-auth 认证，并通过 GitHub Actions 自动部署。

## 技术栈

- [Astro 6](https://astro.build/) — 静态站点生成 + SSR API 路由
- [TypeScript](https://www.typescriptlang.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/) + [D1](https://developers.cloudflare.com/d1/) + [KV](https://developers.cloudflare.com/kv/)
- [better-auth](https://www.better-auth.com/) — GitHub OAuth + 邮箱密码认证
- [Vitest](https://vitest.dev/) — 单元测试
- 自定义 CSS（Swiss Minimal 风格，无 Tailwind/UI 框架）

## 功能

- Markdown 博文渲染，支持代码块高亮、阅读时长估算
- 标签归档与文章列表分组
- 基于 better-auth 的登录/登出（GitHub OAuth）
- 本地开发使用 `@astrojs/node`，生产环境使用 `@astrojs/cloudflare`
- 构建时通过自定义 rehype 插件增强代码块 UI

## 快速开始

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev
```

本地需要 `.env` 文件配置 GitHub OAuth 等环境变量，详见 `.env.example`（如存在）或 `wrangler.toml` 中的绑定名称。

## 脚本

```bash
pnpm dev        # 本地开发（Node adapter）
pnpm build      # 生产构建（Cloudflare adapter）
pnpm deploy     # 手动 wrangler deploy（生产建议走 GitHub Actions）
pnpm preview    # 预览构建产物
pnpm test       # 运行 Vitest 单元测试
pnpm test:watch # 监听模式运行测试
```

## 部署

推送至 `main` 分支会自动触发 `.github/workflows/deploy.yml`：

1. 在 GitHub 仓库设置中添加 Secrets：
   - `CLOUDFLARE_API_TOKEN` — 具有 Cloudflare Workers 编辑权限的 API Token
   - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 账户 ID
2. 确保 `wrangler.toml` 中的 D1/KV 绑定 ID 与 Cloudflare 控制台一致
3. 推送 `main` 分支后，GitHub Actions 会自动构建并部署到 Cloudflare Workers

## 项目结构

更详细的知识库请查看 [`AGENTS.md`](./AGENTS.md)。

```
├── src/
│   ├── components/      # Astro 组件
│   ├── content/blog/    # Markdown 博文
│   ├── layouts/         # 页面布局
│   ├── lib/             # 工具函数与认证逻辑
│   ├── pages/           # 文件路由
│   └── plugins/         # 自定义 rehype 插件
├── public/              # 全局样式与静态资源
├── scripts/             # 构建后脚本
├── .github/workflows/   # CI/CD
├── astro.config.ts      # Astro 配置
├── wrangler.toml        # Cloudflare Workers 配置
└── vitest.config.ts     # 测试配置
```

## 许可

MIT
