// src/lib/cloudflare-env.ts
// 在 Cloudflare Workers 运行时获取 bindings；本地 Node 开发时返回 undefined，由调用方回退到 process.env / import.meta.env

export async function getCloudflareEnv(): Promise<Record<string, unknown> | undefined> {
  try {
    const { env } = await import("cloudflare:workers");
    return env as Record<string, unknown>;
  } catch {
    // 本地开发使用 @astrojs/node，不存在 cloudflare:workers 模块
    return undefined;
  }
}
