/**
 * 日期格式化工具
 */

/** 格式化为 YYYY.MM.DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 格式化为 YYYY.MM */
export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}

/** 格式化为中文长日期 */
export function formatDateLong(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y} 年 ${m} 月 ${d} 日`;
}

/**
 * 计算预估阅读时长。
 * 中文按 400 字/分钟，英文按 200 词/分钟，混合内容取较大值。
 * 返回格式如 "3 分钟阅读"。
 */
export function estimateReadingTime(text: string): string {
  // Count Chinese characters (CJK Unified Ideographs range)
  const chineseChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? []).length;
  // Count English words (sequences of Latin letters)
  const englishWords = (text.match(/[a-zA-Z]+/g) ?? []).length;

  // Calculate minutes for each
  const chineseMinutes = chineseChars / 400;
  const englishMinutes = englishWords / 200;

  // Use the larger of the two (mixed content takes more time)
  const totalMinutes = Math.max(chineseMinutes, englishMinutes);

  // Minimum 1 minute
  const minutes = Math.max(1, Math.ceil(totalMinutes));

  return `${minutes} 分钟阅读`;
}
