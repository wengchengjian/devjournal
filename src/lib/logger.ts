/**
 * 轻量级开发日志工具
 *
 * - 支持 debug / info / warn / error 四级
 * - 通过 LOG_LEVEL 环境变量或显式参数控制输出级别
 * - 支持命名空间与子 logger，便于追踪请求链路
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child(namespace: string): Logger;
}

function formatTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatPrefix(level: LogLevel, namespace: string): string {
  return `${formatTime()} [${level.toUpperCase()}] [${namespace}]`;
}

function resolveLevel(level?: LogLevel): LogLevel {
  if (level && level in LEVELS) return level;

  const envLevel =
    typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined;
  if (envLevel && envLevel in LEVELS) return envLevel as LogLevel;

  return "debug";
}

export function createLogger(namespace: string, level?: LogLevel): Logger {
  const minLevel = resolveLevel(level);
  const minValue = LEVELS[minLevel];

  function log(level: LogLevel, args: unknown[]) {
    if (LEVELS[level] < minValue) return;

    const prefix = formatPrefix(level, namespace);
    const sink = level === "warn" || level === "error" ? console.error : console.log;
    sink(prefix, ...args);
  }

  return {
    debug(...args: unknown[]) {
      log("debug", args);
    },
    info(...args: unknown[]) {
      log("info", args);
    },
    warn(...args: unknown[]) {
      log("warn", args);
    },
    error(...args: unknown[]) {
      log("error", args);
    },
    child(childNamespace: string) {
      return createLogger(`${namespace}:${childNamespace}`, minLevel);
    },
  };
}
