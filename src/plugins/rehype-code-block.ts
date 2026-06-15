/**
 * rehype-code-block —— 给 Shiki 渲染的代码块加 header
 *
 * 输入：<pre data-language="typescript">
 * 输出：
 * <figure class="code-block">
 *   <div class="code-header">
 *     <span class="code-filename">foo.ts</span>  ← 仅当 fence meta 有 title 时
 *     <span class="code-lang">typescript</span>
 *     <button class="copy-btn" type="button" aria-label="复制代码">复制</button>
 *   </div>
 *   <pre data-language="typescript">...</pre>
 * </figure>
 *
 * 设计：构建时注入 DOM（0 JS 做展示），只有复制按钮需要运行时 JS。
 */
import type { Root, RootContent, Element, ElementContent, Properties } from "hast";
import type { RehypePlugin } from "@astrojs/markdown-remark";

// 从 fence meta 字符串解析 title，如 'title="foo.ts"' → 'foo.ts'
function parseTitle(meta: unknown): string | null {
  if (typeof meta !== "string" || !meta) return null;
  const match = meta.match(/title=(?:"([^"]*)"|'([^']*)'|(\S+))/);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

// 创建 hast element 的辅助函数
function h(
  tagName: string,
  properties: Properties,
  children: ElementContent[]
): Element {
  return { type: "element", tagName, properties, children };
}

function text(value: string): ElementContent {
  return { type: "text", value };
}

/** 判断是否是 Shiki 输出的代码块 pre */
function isShikiPre(node: RootContent): node is Element {
  if (node.type !== "element" || node.tagName !== "pre") return false;
  // Shiki 会注入 data-language 属性（rehype 阶段为 dataLanguage）
  const props = (node as Element).properties ?? {};
  return "dataLanguage" in props || "data-language" in props;
}

export const rehypeCodeBlock: RehypePlugin = () => {
  return (tree: Root) => {
    const wrap = (node: RootContent): RootContent => {
      if (!isShikiPre(node)) return node;

      const props = node.properties ?? {};
      // Shiki 在 hast 阶段用 camelCase
      const lang =
        (props.dataLanguage as string) ??
        (props["data-language"] as string) ??
        "text";
      const filename = parseTitle(props.dataMeta ?? props["data-meta"]);

      // header 左侧：可选文件名 + 语言标签
      const leftChildren: ElementContent[] = [];
      if (filename) {
        leftChildren.push(
          h("span", { className: ["code-filename"] }, [text(filename)])
        );
      }
      leftChildren.push(h("span", { className: ["code-lang"] }, [text(lang)]));

      const header = h("div", { className: ["code-header"] }, [
        h("div", { className: ["code-header-left"] }, leftChildren),
        h(
          "button",
          {
            className: ["copy-btn"],
            type: "button",
            ariaLabel: "复制代码",
          },
          [text("复制")]
        ),
      ]);

      return h("figure", { className: ["code-block"] }, [header, node]);
    };

    tree.children = tree.children.map(wrap);
    return tree;
  };
};

export default rehypeCodeBlock;
