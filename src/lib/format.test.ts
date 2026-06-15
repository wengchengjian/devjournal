import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatYearMonth,
  formatDateLong,
  estimateReadingTime,
} from "./format";

describe("formatDate", () => {
  it("格式化为 YYYY.MM.DD", () => {
    expect(formatDate(new Date(2024, 4, 20))).toBe("2024.05.20");
  });

  it("补零月份与日期", () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe("2024.01.01");
  });
});

describe("formatYearMonth", () => {
  it("格式化为 YYYY.MM", () => {
    expect(formatYearMonth(new Date(2024, 11, 25))).toBe("2024.12");
  });
});

describe("formatDateLong", () => {
  it("格式化为中文长日期", () => {
    expect(formatDateLong(new Date(2024, 4, 20))).toBe("2024 年 5 月 20 日");
  });
});

describe("estimateReadingTime", () => {
  it("空内容至少返回 1 分钟", () => {
    expect(estimateReadingTime("")).toBe("1 分钟阅读");
  });

  it("400 个汉字约为 1 分钟", () => {
    const text = "汉".repeat(400);
    expect(estimateReadingTime(text)).toBe("1 分钟阅读");
  });

  it("800 个汉字约为 2 分钟", () => {
    const text = "汉".repeat(800);
    expect(estimateReadingTime(text)).toBe("2 分钟阅读");
  });

  it("200 个英文单词约为 1 分钟", () => {
    const text = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingTime(text)).toBe("1 分钟阅读");
  });

  it("中英文混合取较大值", () => {
    const chinese = "中".repeat(600);
    const english = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingTime(`${chinese} ${english}`)).toBe("2 分钟阅读");
  });
});
