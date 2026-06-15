// src/middleware.ts —— Astro 中间件
// 在每个请求前注入用户 session 到 Astro.locals

import { createAuth } from "@/lib/auth";
import { getCloudflareEnv } from "@/lib/cloudflare-env";
import { createLogger } from "@/lib/logger";
import { defineMiddleware } from "astro:middleware";

const logger = createLogger("middleware");

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // 静态预渲染页面不需要访问 request headers，跳过认证可避免 Astro 警告
  // API 路由（如 /api/auth/*）需要会话查询，保留认证逻辑
  if (!pathname.startsWith("/api/")) {
    logger.debug(`${context.request.method} ${pathname} — 静态页面，跳过认证`);
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  logger.info(`${context.request.method} ${pathname}`);

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

  // Cloudflare 有 D1 → 正常认证；本地无 D1 → 跳过认证
  const isCloudflare = typeof authEnv.DB !== "undefined";
  const authSource = isCloudflare ? "cloudflare" : "local-memory";

  if (!authEnv.GITHUB_CLIENT_ID) {
    logger.info(`无 GitHub OAuth 凭证，跳过认证（源: ${authSource}）`);
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  logger.debug(`认证源: ${authSource}`);

  const auth = createAuth(authEnv);
  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });
    if (session) {
      logger.debug(`已认证用户: ${session.user.id}`);
      context.locals.user = session.user;
      context.locals.session = session.session;
    } else {
      logger.debug("未找到认证会话");
      context.locals.user = null;
      context.locals.session = null;
    }
  } catch (error) {
    logger.error("认证会话查询失败", error);
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});