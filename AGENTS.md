# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-15
**Stack:** Astro 6 + TypeScript + Cloudflare Workers static assets (D1 + KV)
**Package Manager:** pnpm

## OVERVIEW

个人技术博客（devjournal），基于 Astro 6 构建，中英文混合内容。
部署在 **Cloudflare Workers（static assets 模式）**，使用 D1 数据库 + KV 缓存支持 better-auth 认证，并通过 GitHub Actions 自动部署。
Swiss Minimal 设计风格，自定义 CSS Token（无 Tailwind/UI 框架）。

## STRUCTURE

```
blog/
├── astro.config.ts          # 双 adapter：Node（本地开发）/ Cloudflare（生产）
├── wrangler.toml            # Cloudflare Workers 配置（D1 + KV）
├── vitest.config.ts         # Vitest 测试框架配置
├── pnpm-workspace.yaml      # 允许 esbuild/sharp/workerd 原生构建
├── scripts/
│   └── post-build.mjs       # 构建后写入 dist/.assetsignore
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions 自动 wrangler deploy
├── src/
│   ├── components/          # 5 个 Astro 组件
│   ├── content/blog/        # Markdown 博文（3 篇）
│   ├── layouts/             # BaseLayout.astro
│   ├── lib/                 # 工具函数（auth / format / posts / logger / cloudflare-env）
│   ├── pages/               # 文件路由（含动态路由 [...slug]）
│   ├── plugins/             # 自定义 rehype 插件
│   └── *.test.ts            # 与源文件同目录的单元测试
│   └── styles/              # 已迁移到 public/，仅保留目录结构
└── public/
    ├── global.css           # 全局样式 + 设计 Token
    └── pagefind.css         # 搜索页样式
```

## WHERE TO LOOK

| 任务 | 路径 |
|------|------|
| 博文查询/排序 | src/lib/posts.ts |
| 认证逻辑 | src/lib/auth.ts / auth-client.ts |
| Cloudflare env 获取 | src/lib/cloudflare-env.ts |
| 中间件（session 注入） | src/middleware.ts |
| 认证 API 路由 | src/pages/api/auth/[...all].ts |
| 开发日志 | src/lib/logger.ts |
| 自定义 rehype 插件 | src/plugins/rehype-code-block.ts |
| 内容集合 schema | src/content.config.ts |
| 全局样式/设计 Token | public/global.css + public/pagefind.css |
| Astro locals 类型声明 | src/env.d.ts |
| GitHub Actions 部署 | .github/workflows/deploy.yml |
| 构建后产物处理 | scripts/post-build.mjs |

## CODE MAP

| 模块 | 路径 | 职责 | 消费者 |
|------|------|------|--------|
| 认证工厂 | src/lib/auth.ts | createAuth(env)，注入 D1/KV/内存存储 | middleware.ts、api/auth/[...all].ts |
| 认证客户端 | src/lib/auth-client.ts | signIn / signOut 前端调用 | Header.astro |
| 文章查询 | src/lib/posts.ts | getSortedPosts / getPostsByTag / groupByYear | pages/posts/index.astro、pages/tags/[tag].astro |
| 格式化 | src/lib/format.ts | formatDate、estimateReadingTime（CJK 优化） | PostList.astro、[...slug].astro |
| 开发日志 | src/lib/logger.ts | createLogger(namespace, level?)，支持 LOG_LEVEL | middleware.ts、api/auth/[...all].ts |
| Cloudflare env | src/lib/cloudflare-env.ts | 动态导入 cloudflare:workers env，Node 下返回 undefined | middleware.ts、api/auth/[...all].ts |
| 代码块插件 | src/plugins/rehype-code-block.ts | 构建时代码块 UI 增强 | astro.config.ts |
| 类型声明 | src/env.d.ts | App.Locals（user/session）+ process.env + ImportMetaEnv | 全局 |

## CONVENTIONS（与非标准偏差）

| 标准 Astro 模式 | 本项目的偏差 |
|-----------------|-------------|
| 单一 adapter | 双 adapter（Node 本地开发 + CF 生产），通过 DEPLOY_ENV 切换 |
| 通常无认证 | 集成 better-auth（GitHub OAuth + 邮箱密码），SSR API 路由 + D1/KV |
| 常用 Tailwind 或框架 | 纯自定义 CSS（Swiss Minimal 设计系统），无任何 UI 框架 |
| 内容集合使用旧版 loader API | Astro 6 的 processor: unified(...) API（新版） |
| rehype 插件直接在 config 中 inline | 单独 src/plugins/ 目录存放 |
| 通常有 linter（ESLint/Biome） | 无 lint/formatter 配置 |
| 纯静态 | SSR（认证 API）+ SSG（博文）混合模式 |
| 无 Cloudflare 绑定 | wrangler.toml + @cloudflare/workers-types |
| 环境变量单一来源 | cloudflare:workers env → process.env → import.meta.env 三层回退（middleware 与 auth API 共用） |
| Cloudflare Pages 原生 Git 集成 | 改为 GitHub Actions + `npx wrangler deploy` 到 Workers |

## ANTI-PATTERNS（禁止）

- 不要使用 Tailwind UI 库 — 设计系统是纯 CSS
- 不要添加全局 JS 框架（React/Vue/Svelte）— Astro islands 足够
- 不要在本地开发时依赖 D1/KV 实际绑定 — 无 D1 时走内存 fallback
- 不要在 middleware 中阻塞非 API 路由 — 静态页面跳过认证
- 不要使用 import 路径别名以外的相对深路径 — 使用 `@/` 别名
- 不要继续使用 `Astro.locals.runtime.env` — `@astrojs/cloudflare` v13 已移除，改用 `cloudflare:workers` 导入
- 不要从 `src/styles/` 引用 CSS — 已迁移到 `public/`
- 不要手动修改 `dist/` 中的资源忽略规则 — 由 `scripts/post-build.mjs` 统一写入 `.assetsignore`

## COMMANDS

```bash
pnpm dev        # 本地开发（Node adapter）
pnpm build      # 生产构建并生成 dist/.assetsignore（Cloudflare 构建产物）
pnpm deploy     # 本地手动 wrangler deploy（生产建议走 GitHub Actions）
pnpm preview    # 预览构建产物
pnpm test       # 运行所有单元测试（Vitest）
pnpm test:watch # 监听模式运行测试
pnpm astro      # Astro CLI
```

## NOTES

- `.env` 中有 GitHub OAuth 本地凭证，切勿提交到仓库（已在 `.gitignore` 中）
- 环境变量回退链：`cloudflare:workers` env → `process.env` → `import.meta.env`（middleware 与 auth API 共用）
- `@astrojs/cloudflare` v13 不再注入 `ctx.locals.runtime.env`，统一通过 `src/lib/cloudflare-env.ts` 获取
- `wrangler.toml` 已配置 D1/KV 真实 ID，生产部署由 GitHub Actions 自动完成
- 本地 KV 调试数据保存在 `.wrangler/state/v3/kv/`
- 无 linter/formatter 配置
- 测试框架：Vitest，测试文件与源文件同目录（`*.test.ts`）
- 开发日志：通过 `src/lib/logger.ts` 输出，级别由 `LOG_LEVEL` 环境变量控制（debug/info/warn/error）
- Astro 6 的 `markdown.processor` 替代了旧版 `rehypePlugins` 配置方式
- Shiki 双主题：github-light（亮色）/ github-dark（暗色）
- 代码块 UI 由 `rehype-code-block` 插件在构建时注入（零 JS，仅复制按钮需要运行时）
- `workerd` 在 Windows 本地开发环境无法直接运行（access violation），因此本地使用 `@astrojs/node`，生产构建交给 GitHub Actions 的 `ubuntu-latest`
- `astro.config.ts` 已将 `cloudflare:workers` 加入 `vite.build.rollupOptions.external`，避免 Node 构建时打包该模块
