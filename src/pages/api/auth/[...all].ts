// src/pages/api/auth/[...all].ts —— better-auth API 路由
// catch-all 路由：处理 /api/auth/* 所有认证端点

import { createAuth } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare-env";
import { createLogger } from "@/lib/logger";
import type { APIRoute } from "astro";

const logger = createLogger("auth:api");

// 此路由不预渲染，需要 SSR 处理请求
export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  const { pathname } = ctx.url;
  logger.info(`${ctx.request.method} ${pathname}`);

  // 优先从 Cloudflare Workers 运行时获取环境绑定
  // 本地开发（Node adapter）不存在 cloudflare:workers，回退到 process.env / import.meta.env
  const cfEnv = await getCloudflareEnv();
  const env = cfEnv ?? {};

  const authEnv = {
    DB: (env.DB ?? process.env.DB ?? import.meta.env.DB) as D1Database | undefined,
    KV: (env.KV ?? process.env.KV ?? import.meta.env.KV) as KVNamespace | undefined,
    GITHUB_CLIENT_ID: (env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID ?? import.meta.env.GITHUB_CLIENT_ID) as string | undefined,
    GITHUB_CLIENT_SECRET: (env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? import.meta.env.GITHUB_CLIENT_SECRET) as string | undefined,
    BETTER_AUTH_SECRET: (env.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? import.meta.env.BETTER_AUTH_SECRET) as string | undefined,
    BETTER_AUTH_URL: (env.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? import.meta.env.BETTER_AUTH_URL) as string | undefined,
  };

  const isCloudflare = typeof authEnv.DB !== "undefined";
  logger.debug(`认证源: ${isCloudflare ? "cloudflare" : "local-memory"}`);

  const auth = createAuth(authEnv);
  return auth.handler(ctx.request);
};