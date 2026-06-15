/// <reference path="../.astro/types.d.ts" />

declare const process: {
  env: Record<string, string | undefined>;
};

interface ImportMetaEnv {
  readonly LOG_LEVEL?: string;
}

declare namespace App {
  interface Locals {
    user: import("better-auth").User | null;
    session: import("better-auth").Session | null;
    /** Cloudflare Pages runtime bindings */
    runtime?: {
      env: {
        DB: D1Database;
        KV: KVNamespace;
        GITHUB_CLIENT_ID: string;
        GITHUB_CLIENT_SECRET: string;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
      };
    };
  }
}