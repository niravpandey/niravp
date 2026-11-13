/**
 * Editor-preview only: tags every rendered element with the character range it came from
 * (`data-src-start` / `data-src-end`), so a selection in the preview can be mapped back to the
 * markdown. Math and JSX components are marked `data-src-atomic` — they always map to their
 * whole source, since their rendered text doesn't resemble it.
 *
 * Must run before rehype-katex: katex replaces math nodes (dropping their position), so each
 * math node is wrapped in a span/div that keeps the range.
 */

type Position = { start: { offset?: number }; end: { offset?: number } };

type HastNode = {
  type: string;
  tagName?: string;
  name?: string;
  properties?: Record<string, unknown>;
  attributes?: { type: string; name: string; value: string | null }[];
  children?: HastNode[];
  position?: Position;
};

function getRange(node: HastNode) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;

  return typeof start === "number" && typeof end === "number" ? { start, end } : null;
}

function hasMathClass(node: HastNode | undefined) {
  const className = node?.properties?.className;

  return (
    Array.isArray(className) &&
    (className.includes("math-inline") || className.includes("math-display") || className.includes("language-math"))
  );
}

/** Returns the node katex will replace: the math element itself, or the `<pre>` around display math. */
function isMathScope(node: HastNode) {
  if (node.type !== "element") return false;
  if (hasMathClass(node)) return true;

  const elementChildren = node.children?.filter((child) => child.type === "element") ?? [];

  return node.tagName === "pre" && elementChildren.length === 1 && hasMathClass(elementChildren[0]);
}

function annotate(parent: HastNode) {
  const children = parent.children;
  if (!children) return;

  children.forEach((child, index) => {
    const range = getRange(child);

    if (isMathScope(child)) {
      if (!range) return;

      const display = child.tagName === "pre" || child.tagName === "div";

      children[index] = {
        type: "element",
        tagName: display ? "div" : "span",
        properties: { dataSrcStart: range.start, dataSrcEnd: range.end, dataSrcAtomic: true },
        children: [child],
        position: child.position,
      };
      return;
    }

    if (child.type === "element") {
      if (range) {
        child.properties = { ...child.properties, dataSrcStart: range.start, dataSrcEnd: range.end };
      }
    } else if ((child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") && range) {
      child.attributes = [
        ...(child.attributes ?? []),
        { type: "mdxJsxAttribute", name: "data-src-start", value: String(range.start) },
        { type: "mdxJsxAttribute", name: "data-src-end", value: String(range.end) },
        { type: "mdxJsxAttribute", name: "data-src-atomic", value: null },
      ];
    }

    annotate(child);
  });
}

export default function rehypeSourcePositions() {
  return (tree: HastNode) => {
    annotate(tree);
  };
}
