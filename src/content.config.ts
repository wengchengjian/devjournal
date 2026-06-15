import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

// 博客文章集合 —— zod schema 校验 frontmatter
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // 字符串日期会被自动解析为 Date 对象
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // 是否为草稿（草稿不会出现在列表中，但可直接访问 URL）
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };