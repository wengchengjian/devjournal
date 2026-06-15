// src/lib/auth.ts —— better-auth 服务端配置
// 工厂模式：每次请求创建 auth 实例，注入 Cloudflare D1/KV binding

import { betterAuth } from "better-auth";

/**
 * Cloudflare 环境绑定类型
 * 本地开发时 env 为空对象，better-auth fallback 到内存存储
 */
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

/**
 * 创建 better-auth 实例
 * - 生产环境：使用 D1 数据库 + KV secondary storage
 * - 本地开发：使用内存 fallback（D1Database 不可用时）
 */
export function createAuth(env: Partial<Env> = {}) {
  const isCloudflare = typeof env.DB !== "undefined";

  return betterAuth({
    // 基础 URL — GitHub OAuth 回调需要
    baseURL: env.BETTER_AUTH_URL || "http://localhost:4321",

    // 认证密钥 — 生产环境必须通过环境变量设置
    // 本地开发使用固定密钥，仅用于调试
    secret:
      env.BETTER_AUTH_SECRET ||
      "dev-local-secret-do-not-use-in-production-32chrx",

    // 数据库配置
    // Cloudflare D1：原生支持，better-auth 自动检测 D1 binding
    // 本地开发：不传 database 参数，better-auth 使用内存存储
    ...(isCloudflare
      ? {
          database: env.DB as D1Database,
          secondaryStorage: {
            get: async (key: string) => {
              return (await env.KV?.get(key)) ?? null;
            },
            set: async (key: string, value: string, ttl?: number) => {
              await env.KV?.put(key, value, ttl ? { expirationTtl: ttl } : undefined);
            },
            delete: async (key: string) => {
              await env.KV?.delete(key);
            },
          },
        }
      : {
          // 本地开发 fallback：不配置数据库，better-auth 使用内存存储
          // 注意：这不支持持久化，仅用于开发调试
          database: undefined,
        }),

    // GitHub OAuth 登录
    // 仅在配置了 clientId 和 clientSecret 时启用，避免未配置时 better-auth 输出警告
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          socialProviders: {
            github: {
              clientId: env.GITHUB_CLIENT_ID,
              clientSecret: env.GITHUB_CLIENT_SECRET,
            },
          },
        }
      : {}),

    // 邮箱密码登录（备用）
    emailAndPassword: {
      enabled: true,
    },

    // trustedOrigins 用于跨域认证
    trustedOrigins: [env.BETTER_AUTH_URL || "http://localhost:4321"],
  });
}

/**
 * 默认 auth 实例（用于 CLI 生成 schema 和类型）
 * 本地开发或类型推断使用
 */
export const auth = createAuth();