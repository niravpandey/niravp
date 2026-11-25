/**
 * Makes GFM task lists (`- [ ] understand …`) usable as revision checklists.
 *
 * remark-gfm renders each item as `<li class="task-list-item"><input type="checkbox" disabled> …`.
 * This plugin:
 *  - gives every checkbox a `data-task-id` built from its item's text, so a reader's ticks survive
 *    the note being edited or items being reordered (duplicates get a `-2`, `-3` suffix);
 *  - wraps the checkbox and the text after it in a `<label>`, so clicking the text toggles it.
 *
 * Runs before rehype-katex, so maths contributes its TeX source to the id rather than KaTeX markup.
 */

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const BLOCK_TAGS = new Set(["ul", "ol", "p", "div", "pre", "blockquote", "table"]);

function isTaskCheckbox(node: HastNode) {
  return node.type === "element" && node.tagName === "input" && node.properties?.type === "checkbox";
}

function isTaskItem(node: HastNode) {
  const className = node.properties?.className;
  return node.tagName === "li" && Array.isArray(className) && className.includes("task-list-item");
}

/** Text of an item, ignoring any nested lists (they're separate items). */
function itemText(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (node.tagName === "ul" || node.tagName === "ol") return "";
  return (node.children ?? []).map(itemText).join("");
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

/** Wraps the checkbox and the inline content after it (up to the first block) in a <label>. */
function wrapInLabel(parent: HastNode, id: string) {
  const children = parent.children ?? [];
  const start = children.findIndex(isTaskCheckbox);
  if (start === -1) return false;

  const checkbox = children[start];
  checkbox.properties = { ...checkbox.properties, dataTaskId: id };

  let end = start + 1;
  while (end < children.length && !(children[end].type === "element" && BLOCK_TAGS.has(children[end].tagName ?? ""))) {
    end += 1;
  }

  const label: HastNode = {
    type: "element",
    tagName: "label",
    properties: { className: ["task-label"] },
    children: children.slice(start, end),
  };
  parent.children = [...children.slice(0, start), label, ...children.slice(end)];
  return true;
}

export default function rehypeTaskList() {
  return (tree: HastNode) => {
    const seen = new Map<string, number>();

    const walk = (node: HastNode) => {
      if (isTaskItem(node)) {
        const base = slugify(itemText(node));
        const count = (seen.get(base) ?? 0) + 1;
        seen.set(base, count);
        const id = count === 1 ? base : `${base}-${count}`;

        // Tight lists hold the checkbox directly; loose lists put it inside the first <p>.
        if (!wrapInLabel(node, id)) {
          const firstParagraph = node.children?.find((child) => child.tagName === "p");
          if (firstParagraph) wrapInLabel(firstParagraph, id);
        }
      }

      node.children?.forEach(walk);
    };

    walk(tree);
  };
}
