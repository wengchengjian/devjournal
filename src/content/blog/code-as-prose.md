---
title: "代码即散文：如何写出读起来像诗的函数"
description: "我们花了太多时间讨论代码的效率，却太少讨论它的美感。这篇文章关于命名、关于节奏、关于如何在 if-else 中找到诗意的留白。"
pubDate: 2026-06-12
tags: ["编程哲学", "思考"]
---

最好的代码不是写给机器看的，而是写给六个月后那个忘了一切的自己。当我们谈论"代码质量"时，往往纠结于性能、测试覆盖率、设计模式——却忽略了最根本的一点：**代码是一种表达媒介**。

就像散文有节奏，诗歌有韵律，好的函数也有自己的呼吸感。它不在于你用了多聪明的算法，而在于读者能否在 3 秒内理解你的意图。

## 一个反面教材

先看一段典型的"能跑就行"代码：

```typescript
// ❌ 一个做了太多事的函数
function process(d: any[]) {
  const r = d.filter(x => x.a > 0).map(x => ({...x, b: x.a * 2}))
  return r.sort((a, b) => a.b - b.b).slice(0, 10)
}
```

这段代码没有错——它能跑，甚至跑得挺快。但读起来像一气呵成的长句，没有停顿，没有呼吸。

## 重写：像短句一样清晰

让我们把它拆开：

```typescript
// ✅ 每个函数只做一件事，像短句一样清晰
const keepValid = (items: Item[]) =>
  items.filter(item => item.amount > 0)

const withTax = (items: Item[]) =>
  items.map(item => ({ ...item, total: item.amount * 2 }))

const topTen = (items: Item[]) =>
  items.sort((a, b) => b.total - a.total).slice(0, 10)

// 现在 process 读起来像一句话
const process = pipe(keepValid, withTax, topTen)
```

注意第二个版本里发生了什么：我们把一个长链条拆成了三个有名字的小函数。`keepValid`、`withTax`、`topTen`——每个名字都在讲故事。最后的 `pipe` 把它们串起来，读起来就像一句完整的句子。

> 命名是程序员最难的两件事之一（另一件是缓存失效）。一个好名字能让函数体变得多余。

## 命名的力量

考虑这两个函数签名：

```typescript
// 模糊
function handleData(data: any[]): any

// 清晰
function getTopRevenueUsers(users: User[], limit: number): User[]
```

第二个版本，你甚至不需要看函数体就知道它做什么。这就是好名字的力量——它让代码变得"自解释"。

## 行内代码与细节

有时候你需要在句子里提到一个变量名，比如 `user.id` 或 `useState()`。这时候用行内代码（backtick）会让技术写作更清晰。

列表也很重要：

1. **克制**：不是写得越少越好，而是每个词都承担意义
2. **节奏**：长句和短句交替，避免视觉疲劳
3. **命名**：函数名是承诺，要么兑现，要么改名

## 结语

这就是代码与散文的共通之处：**节制**。不是写得越少越好，而是每个词都承担意义。

好的代码和好的文字一样，都需要反复打磨。下次写函数的时候，不妨问问自己：如果这是一句话，它读起来通顺吗？
