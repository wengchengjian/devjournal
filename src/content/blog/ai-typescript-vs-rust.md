---
title: "给 AI 写代码：TypeScript 还是 Rust？"
description: "训练语料、迭代速度、生态成熟度——一个务实的对比分析。当你让 AI 帮你写代码，选哪门语言更省心？"
pubDate: 2026-05-28
tags: ["AI", "TypeScript", "Rust", "思考"]
---

现在用 AI 辅助编程已经成了常态。但一个有趣的问题出现了：当你主要靠 AI 写代码时，语言的选择标准会变吗？

答案是：**会，而且变化很大**。

## 评判标准变了

传统的语言选型，我们看：性能、生态、团队熟悉度、招聘难度。

但当你把 AI 当主力开发时，标准变成了：

- **AI 生成准确率**：训练语料够不够多？
- **迭代速度**：改一行能不能立刻看到效果？
- **错误可恢复性**：AI 写错了，纠错成本高不高？

## TypeScript：AI 的舒适区

TypeScript 是目前 AI 最"舒服"的语言。原因有三：

```typescript
// 1. 语料海量 —— AI 几乎不会出语法错
const users = data
  .filter(u => u.active)
  .map(u => u.name)

// 2. 类型提示让 AI 更准
interface User { id: string; name: string; active: boolean }
function greet(user: User): string {
  return `Hello, ${user.name}` // AI 知道这里只能放 string
}
```

第三点是热重载——TypeScript 改一行，秒级看到效果。这对 AI 协作特别重要，因为它可以快速试错。

## Rust：AI 的逆水行舟

Rust 的问题在于**所有权和生命周期**。这两样东西对 AI 来说特别难：

```rust
// AI 经常写出这样的代码
fn process(data: &mut Vec<i32>) -> &i32 {
    let first = &data[0];  // 借用
    data.push(100);         // AI 忘了这里会违反借用规则
    first                   // ❌ 编译错误
}
```

这种错误，AI 需要多轮对话才能修好。每次编译失败都是一次上下文消耗。

## 那 Rust 什么时候值得用？

Rust 不是不能用，而是**用对地方**：

| 场景 | 推荐 |
|---|---|
| 做一个博客网站 | TypeScript，毫无悬念 |
| 做一个命令行工具 | Rust 或 Go 都行 |
| 做静态站点生成器核心 | Rust 完美（如 Zola） |
| 做一个 Web 应用 | TypeScript |
| 做一个数据库引擎 | Rust |

规律是：**离用户界面越近，TypeScript 越好；离系统底层越近，Rust 越好**。

## 一个简单的决策树

```
你的项目需要 DOM / 浏览器吗？
├─ 是 → TypeScript
└─ 否 → 需要极致性能或内存安全吗？
        ├─ 是 → Rust
        └─ 否 → 生态和速度，选 TypeScript
```

## 结语

语言没有绝对优劣，但**在 AI 辅助编程这个特定场景下，TypeScript 的优势被放大了**。它的海量语料、快速反馈循环、宽松的类型系统，都让 AI 写起来更顺手。

Rust 不是不好，只是在"AI 写代码"这个赛道上，它需要你花更多精力去纠错。

选能让你（和你的 AI）跑得更快的那条路。
