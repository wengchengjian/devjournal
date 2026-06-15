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
  }
}