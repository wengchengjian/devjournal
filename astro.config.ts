// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import { unified } from "@astrojs/markdown-remark";
import { rehypeCodeBlock } from "./src/plugins/rehype-code-block";

// 本地开发使用 @astrojs/node（workerd 在 Windows 上有 access violation 问题）
// 生产部署使用 @astrojs/cloudflare（通过 DEPLOY_ENV=production 环境变量切换）
// Cloudflare adapter 自动注入 D1/KV bindings 到 ctx.locals.runtime.env
const adapter =
  process.env.DEPLOY_ENV === "production"
    ? cloudflare()
    : node({ mode: "standalone" });

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  adapter,
  integrations: [sitemap(), pagefind()],
  markdown: {
    shikiConfig: {
      // 双主题：亮色 + 暗色，通过 CSS 变量切换
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
    // 代码块增强：注入 header（语言标签 + 文件名 + 复制按钮）
    // Astro 6 迁移：rehypePlugins 移入 unified processor
    processor: unified({
      rehypePlugins: [rehypeCodeBlock],
    }),
  },
});
