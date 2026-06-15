# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-15
**Stack:** Astro 6 + TypeScript + Cloudflare Pages (D1 + KV)
**Package Manager:** pnpm

## OVERVIEW

个人技术博客（devjournal），基于 Astro 6 构建，中英文混合内容。
部署在 Cloudflare Pages，使用 D1 数据库 + KV 缓存支持 better-auth 认证。
Swiss Minimal 设计风格，自定义 CSS Token（无 Tailwind/UI 框架）。

## STRUCTURE

```
blog/
├── astro.config.ts          # 双 adapter：Node（本地开发）/ Cloudflare（生产）
├── wrangler.toml            # Cloudflare Workers 配置（D1 + KV）
├── vitest.config.ts         # Vitest 测试框架配置
├── pnpm-workspace.yaml      # 允许 esbuild/sharp/workerd 原生构建
├── src/
│   ├── components/          # 5 个 Astro 组件
│   ├── content/blog/        # Markdown 博文（3 篇）
│   ├── layouts/             # BaseLayout.astro
│   ├── lib/                 # 工具函数（auth / format / posts / logger）
│   ├── pages/               # 文件路由（含动态路由 [...slug]）
│   ├── plugins/             # 自定义 rehype 插件
│   └── styles/              # 全局 CSS（设计 Token + 排版）
│   └── *.test.ts            # 与源文件同目录的单元测试
```

## WHERE TO LOOK

| 任务 | 路径 |
|------|------|
| 博文查询/排序 | src/lib/posts.ts |
| 认证逻辑 | src/lib/auth.ts / auth-client.ts |
| 中间件（session 注入） | src/middleware.ts |
| 认证 API 路由 | src/pages/api/auth/[...all].ts |
| 开发日志 | src/lib/logger.ts |
| 自定义 rehype 插件 | src/plugins/rehype-code-block.ts |
| 内容集合 schema | src/content.config.ts |
| 全局样式/设计 Token | src/styles/global.css |
| Astro locals 类型声明 | src/env.d.ts |

## CODE MAP

| 模块 | 路径 | 职责 | 消费者 |
|------|------|------|--------|
| 认证工厂 | src/lib/auth.ts | createAuth(env)，注入 D1/KV/内存存储 | middleware.ts、api/auth/[...all].ts |
| 认证客户端 | src/lib/auth-client.ts | signIn / signOut 前端调用 | Header.astro |
| 文章查询 | src/lib/posts.ts | getSortedPosts / getPostsByTag / groupByYear | pages/posts/index.astro、pages/tags/[tag].astro |
| 格式化 | src/lib/format.ts | formatDate、estimateReadingTime（CJK 优化） | PostList.astro、[...slug].astro |
| 开发日志 | src/lib/logger.ts | createLogger(namespace, level?)，支持 LOG_LEVEL | middleware.ts、api/auth/[...all].ts |
| 代码块插件 | src/plugins/rehype-code-block.ts | 构建时代码块 UI 增强 | astro.config.ts |
| 类型声明 | src/env.d.ts | App.Locals + Cloudflare runtime 类型 | 全局 |

## CONVENTIONS（与非标准偏差）

| 标准 Astro 模式 | 本项目的偏差 |
|-----------------|-------------|
| 单一 adapter | 双 adapter（Node 本地开发 + CF 生产），通过 DEPLOY_ENV 切换 |
| 通常无认证 | 集成 better-auth（GitHub OAuth + 邮箱密码），SSR API 路由 + D1/KV |
| 常用 Tailwind 或框架 | 纯自定义 CSS（Swiss Minimal 设计系统），无任何 UI 框架 |
| 内容集合使用旧版 loader API | Astro 6 的 processor: unified(...) API（新版） |
| rehype 插件直接在 config 中 inline | 单独 src/plugins/ 目录存放 |
| 通常有 linter（ESLint/Biome） | 无 lint/formatter 配置 |
| 纯静态 | SSR（认证）+ SSG（博文）混合模式 |
| 无 Cloudflare 绑定 | wrangler.toml + @cloudflare/workers-types |
| 环境变量单一来源 | runtime.env → process.env → import.meta.env 三层回退（middleware 与 auth API 共用） |

## ANTI-PATTERNS（禁止）

- 不要使用 Tailwind UI 库 — 设计系统是纯 CSS
- 不要添加全局 JS 框架（React/Vue/Svelte）— Astro islands 足够
- 不要在本地开发时依赖 D1/KV 实际绑定 — 无 D1 时走内存 fallback
- 不要在 middleware 中阻塞非 API 路由 — 静态页面跳过认证
- 不要使用 import 路径别名以外的相对深路径 — 使用 @/ 别名

## COMMANDS

```bash
pnpm dev       # 本地开发（Node adapter）
pnpm build     # 生产构建（需 DEPLOY_ENV=production 切换 CF adapter）
pnpm preview   # 预览构建产物
pnpm test      # 运行所有单元测试（Vitest）
pnpm test:watch # 监听模式运行测试
pnpm astro     # Astro CLI
```

## NOTES

- .env 中有 GitHub OAuth 本地凭证，切勿提交到仓库（已在 .gitignore 中）
- 环境变量回退链：cloudflare:workers env → process.env → import.meta.env（middleware 与 auth API 共用）
- wrangler.toml 中 D1/KV id 为占位符，生产部署前必须替换
- 本地 KV 调试数据保存在 .wrangler/state/v3/kv/
- 无 linter/formatter 配置
- 测试框架：Vitest，测试文件与源文件同目录（`*.test.ts`）
- 开发日志：通过 `src/lib/logger.ts` 输出，级别由 `LOG_LEVEL` 环境变量控制（debug/info/warn/error）
- Astro 6 的 markdown.processor 替代了旧版 rehypePlugins 配置方式
- Shiki 双主题：github-light（亮色）/ github-dark（暗色）
- 代码块 UI 由 rehype-code-block 插件在构建时注入（零 JS，仅复制按钮需要运行时）
