# Cloudflare Pages 部署清单

本文档记录将本博客从本地仓库部署到 Cloudflare Pages 的完整步骤。

---

## 1. 本地内容更新流程

```
本地添加/修改 src/content/blog/*.md
        ↓
git add .
git commit -m "post: 文章标题"
git push origin main
        ↓
Cloudflare Pages 自动拉取 → 构建 → 部署
```

只有文章更新时，D1/KV 中的认证数据不会丢失。

---

## 2. GitHub 仓库配置

- [ ] 在 GitHub 创建仓库（例如 `devjournal`）
- [ ] 本地添加远程仓库：
  ```bash
  git remote add origin https://github.com/<用户名>/devjournal.git
  git branch -M main
  git push -u origin main
  ```

---

## 3. Cloudflare Pages 项目连接

- [ ] 登录 Cloudflare Dashboard → Pages
- [ ] 选择「创建项目」→「连接到 Git」
- [ ] 授权 GitHub 并选择 `devjournal` 仓库
- [ ] 构建配置：
  - **构建命令**：`DEPLOY_ENV=production pnpm build`
  - **输出目录**：`dist`
  - 或在环境变量中设置 `DEPLOY_ENV=production`，构建命令只写 `pnpm build`

---

## 4. 环境变量（Cloudflare Pages 控制台）

> `.env` 不会被提交到仓库，这些变量必须在 Cloudflare Pages 后台设置。

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `BETTER_AUTH_SECRET` | better-auth 加密密钥，生产环境必须重新生成 | 随机 32 位以上字符串 |
| `BETTER_AUTH_URL` | 部署后的实际域名 | `https://devjournal.pages.dev` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App 的 Client ID | 从 GitHub 设置获取 |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App 的 Client Secret | 从 GitHub 设置获取 |

---

## 5. Cloudflare 数据库与缓存

### 5.1 创建 D1 数据库

```bash
wrangler d1 create devjournal-auth
```

将返回的 `database_id` 替换到 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "devjournal-auth"
database_id = "替换为你的真实 database_id"
```

### 5.2 创建 KV 命名空间

```bash
wrangler kv:namespace create "KV"
```

将返回的 `id` 替换到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "KV"
id = "替换为你的真实 namespace id"
```

### 5.3 初始化 better-auth 数据表

首次部署前，需要 better-auth 在 D1 中创建表结构。可以在本地或 CI 中执行：

```bash
# 待补充：根据 better-auth 文档生成并应用 migration
```

> 注意：当前项目没有自动 migration 脚本，需要手动执行或补充 npm script。

---

## 6. 修改站点域名

编辑 `astro.config.ts`，将默认域名替换为实际域名：

```ts
site: "https://devjournal.pages.dev",
```

否则 sitemap 和 RSS 中的链接会指向 `https://example.com`。

---

## 7. GitHub OAuth App 配置

- [ ] 访问 https://github.com/settings/developers
- [ ] 创建新的 OAuth App
- [ ] **Authorization callback URL**：`https://devjournal.pages.dev/api/auth/callback/github`
- [ ] 将生成的 Client ID / Client Secret 填入 Cloudflare Pages 环境变量

---

## 8. 验证部署

- [ ] 推送一次代码，观察 Cloudflare Pages 构建日志
- [ ] 访问首页，确认文章列表正常
- [ ] 访问 `/rss.xml`，确认 RSS 链接域名正确
- [ ] 点击 GitHub 登录，确认 OAuth 回调成功
- [ ] 登录后 Header 显示用户头像和「登出」按钮

---

## 9. 后续内容更新

内容更新只需修改 `src/content/blog/*.md` 并 push。

- `draft: true` 的文章不会出现在列表、RSS、标签页，但直接访问 URL 仍可见。
- 也可以直接在 GitHub 网页上编辑 Markdown 文件，commit 后会自动触发部署。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| `astro.config.ts` | 站点域名、adapter 切换、构建配置 |
| `wrangler.toml` | Cloudflare D1 / KV 绑定 |
| `.env.example` | 本地开发环境变量模板 |
| `src/content/blog/` | 文章源文件 |
| `src/content.config.ts` | 文章 frontmatter schema |
