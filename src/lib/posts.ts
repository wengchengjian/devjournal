/**
 * 文章相关工具函数
 */
import { getCollection, type CollectionEntry } from "astro:content";

type Post = CollectionEntry<"blog">;

/**
 * 按发布年份分组文章。
 *
 * 输入需已按日期倒序排序（new → old），
 * 这样分组结果天然从最新年份到最旧年份。
 */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const groups: { year: number; posts: Post[] }[] = [];
  let currentYear: number | null = null;

  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    if (year !== currentYear) {
      groups.push({ year, posts: [] });
      currentYear = year;
    }
    groups[groups.length - 1].posts.push(post);
  }

  return groups;
}

/**
 * 获取所有非草稿文章，按日期倒序。
 */
export async function getSortedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );
}

/**
 * 获取所有唯一标签及其文章数量，按使用次数倒序。
 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getSortedPosts();
  const tagMap = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }
  return [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取某标签下的所有文章，按日期倒序。
 */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getSortedPosts();
  return posts.filter((post) => post.data.tags.includes(tag));
}
