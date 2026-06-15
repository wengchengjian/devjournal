// src/lib/auth-client.ts —— better-auth 浏览器客户端
// 用于前端组件调用认证 API（登录、登出、获取 session）

import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  // baseURL 默认指向当前域名，生产环境无需配置
  // 本地开发通过 CORS trustedOrigins 处理
});

// 便捷方法
export const {
  signIn,
  signOut,
  getSession,
  useSession,
} = authClient;