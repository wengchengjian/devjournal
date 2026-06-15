import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLogger, type LogLevel } from "./logger";

describe("createLogger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("默认 debug 级别会输出所有级别日志", () => {
    const logger = createLogger("app");

    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg");

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("error 级别只输出 error 日志", () => {
    const logger = createLogger("app", "error");

    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR]"),
      "error msg"
    );
  });

  it("输出包含时间戳、级别、命名空间，并把消息作为独立参数", () => {
    const logger = createLogger("http", "info");

    logger.info("hello");

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{2}:\d{2}:\d{2} \[INFO\] \[http\]$/),
      "hello"
    );
  });

  it("会把额外的参数透传给 console", () => {
    const logger = createLogger("app", "info");
    const extra = { key: "value" };

    logger.info("message", extra);

    expect(logSpy).toHaveBeenCalledWith(expect.any(String), "message", extra);
  });

  it("child logger 继承父级级别并拼接命名空间", () => {
    const parent = createLogger("app", "warn");
    const child = parent.child("auth");

    child.info("info msg");
    child.warn("warn msg");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[app:auth]"),
      "warn msg"
    );
  });

  it("可通过 LOG_LEVEL 环境变量设置默认级别", () => {
    const original = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "warn";

    const logger = createLogger("env");
    logger.info("info msg");
    logger.warn("warn msg");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    process.env.LOG_LEVEL = original;
  });

  it("忽略未知的环境变量级别并回退到 debug", () => {
    const original = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "unknown";

    const logger = createLogger("fallback");
    logger.debug("debug msg");

    expect(logSpy).toHaveBeenCalledTimes(1);

    process.env.LOG_LEVEL = original;
  });
});
