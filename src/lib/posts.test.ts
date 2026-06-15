import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionEntry } from "astro:content";
import {
  groupByYear,
  getSortedPosts,
  getAllTags,
  getPostsByTag,
} from "./posts";

vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

import { getCollection } from "astro:content";

type Post = CollectionEntry<"blog">;

function mockCollection(_name: string, filter?: (entry: Post) => boolean) {
  return Promise.resolve(filter ? posts.filter(filter) : posts);
}

function createPost(overrides: {
  id: string;
  slug?: string;
  title: string;
  pubDate: Date;
  tags?: string[];
  draft?: boolean;
}): Post {
  return {
    id: overrides.id,
    slug: overrides.slug ?? overrides.id,
    body: "",
    collection: "blog",
    data: {
      title: overrides.title,
      description: "",
      pubDate: overrides.pubDate,
      tags: overrides.tags ?? [],
      draft: overrides.draft ?? false,
    },
  } as Post;
}

const posts: Post[] = [
  createPost({
    id: "post-1",
    title: "最新文章",
    pubDate: new Date(2024, 5, 15),
    tags: ["astro", "auth"],
  }),
  createPost({
    id: "post-2",
    title: "去年的文章",
    pubDate: new Date(2023, 8, 10),
    tags: ["astro"],
  }),
  createPost({
    id: "post-3",
    title: "草稿",
    pubDate: new Date(2024, 0, 1),
    tags: ["css"],
    draft: true,
  }),
  createPost({
    id: "post-4",
    title: "另一篇 2024 文章",
    pubDate: new Date(2024, 2, 8),
    tags: ["auth", "css"],
  }),
];

describe("groupByYear", () => {
  it("按年份分组并保持倒序", () => {
    const sorted = [...posts].sort(
      (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
    );
    const groups = groupByYear(sorted);

    expect(groups).toHaveLength(2);
    expect(groups[0].year).toBe(2024);
    expect(groups[0].posts).toHaveLength(3);
    expect(groups[1].year).toBe(2023);
    expect(groups[1].posts).toHaveLength(1);
  });

  it("空数组返回空分组", () => {
    expect(groupByYear([])).toEqual([]);
  });
});

describe("getSortedPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("返回非草稿文章并按日期倒序排列", async () => {
    vi.mocked(getCollection).mockImplementation(mockCollection);

    const result = await getSortedPosts();

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("post-1");
    expect(result[1].id).toBe("post-4");
    expect(result[2].id).toBe("post-2");
  });
});

describe("getAllTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("统计所有非草稿文章的标签并按使用次数倒序", async () => {
    vi.mocked(getCollection).mockImplementation(mockCollection);

    const result = await getAllTags();

    expect(result).toEqual([
      { tag: "astro", count: 2 },
      { tag: "auth", count: 2 },
      { tag: "css", count: 1 },
    ]);
  });
});

describe("getPostsByTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("返回包含指定标签的文章并按日期倒序", async () => {
    vi.mocked(getCollection).mockImplementation(mockCollection);

    const result = await getPostsByTag("auth");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("post-1");
    expect(result[1].id).toBe("post-4");
  });

  it("不存在的标签返回空数组", async () => {
    vi.mocked(getCollection).mockImplementation(mockCollection);

    const result = await getPostsByTag("missing");

    expect(result).toEqual([]);
  });
});
