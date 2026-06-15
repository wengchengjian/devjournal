// scripts/post-build.mjs
// Astro 构建完成后生成 .assetsignore，防止 Cloudflare Workers 把 _worker.js / _routes.json 当作静态资源上传

import { existsSync, writeFileSync } from "node:fs";

if (existsSync("dist")) {
  writeFileSync("dist/.assetsignore", "_worker.js\n_routes.json\n");
}
