"use client";

/**
 * Maps between the editor-preview DOM and the markdown source, using the
 * `data-src-start` / `data-src-end` ranges added by rehypeSourcePositions.
 */

export type SourceRange = { start: number; end: number };

const SOURCE_SELECTOR = "[data-src-start]";

function readRange(element: Element): SourceRange | null {
  const start = Number(element.getAttribute("data-src-start"));
  const end = Number(element.getAttribute("data-src-end"));

  return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
}

function closestSourceElement(node: Node | null, root: Element) {
  const element = node instanceof Element ? node : node?.parentElement;
  const match = element?.closest(SOURCE_SELECTOR);

  return match && root.contains(match) ? match : null;
}

/** Atomic elements (math, images) always map to their whole source. */
function atomicAncestor(node: Node | null, root: Element) {
  const element = node instanceof Element ? node : node?.parentElement;
  const match = element?.closest("[data-src-atomic]");

  return match && root.contains(match) ? match : null;
}

/** Index of the `n`th (0-based) occurrence of `needle` in `hay`, or -1. */
function nthIndexOf(hay: string, needle: string, n: number) {
  let index = -1;

  for (let i = 0; i <= n; i += 1) {
    index = hay.indexOf(needle, index + 1);
    if (index === -1) return -1;
  }

  return index;
}

function countOccurrences(hay: string, needle: string) {
  let count = 0;

  for (let index = hay.indexOf(needle); index !== -1; index = hay.indexOf(needle, index + 1)) {
    count += 1;
  }

  return count;
}

type TextPart = { node: Text; from: number; to: number };

/** The text nodes the selection actually covers (ignoring empty edges, e.g. after a triple-click). */
function selectedTextParts(range: Range, root: Element): TextPart[] {
  const container = range.commonAncestorContainer;
  const nodes: Text[] = [];

  if (container.nodeType === Node.TEXT_NODE) {
    nodes.push(container as Text);
  } else {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (range.intersectsNode(node)) nodes.push(node as Text);
    }
  }

  return nodes
    .filter((node) => root.contains(node))
    .map((node) => ({
      node,
      from: node === range.startContainer ? range.startOffset : 0,
      to: node === range.endContainer ? range.endOffset : node.data.length,
    }))
    .filter((part) => part.node.data.slice(part.from, part.to).trim().length > 0);
}

/**
 * Source position of one selected text fragment. The fragment's text is looked up inside its
 * element's source; if the same words appear more than once there, the occurrence matching
 * the one actually selected is used (so selecting the third "the" doesn't jump to the first).
 */
function locatePart(part: TextPart, root: Element, source: string, edge: "start" | "end") {
  const atomic = atomicAncestor(part.node, root);
  const element = atomic ?? closestSourceElement(part.node, root);
  const elementRange = element ? readRange(element) : null;

  if (!element || !elementRange) return null;
  if (atomic) return edge === "start" ? elementRange.start : elementRange.end;

  const raw = part.node.data.slice(part.from, part.to);
  const leading = raw.length - raw.trimStart().length;
  const fullNeedle = raw.trim();
  const slice = source.slice(elementRange.start, elementRange.end);

  // Rendered text before the fragment, within this element.
  const before = document.createRange();
  before.setStart(element, 0);
  before.setEnd(part.node, part.from + leading);
  const renderedBefore = before.toString();

  // Long fragments may contain escapes/entities that differ from the source, so fall back to
  // matching just the edge of the fragment that matters.
  const candidates = [fullNeedle];
  if (fullNeedle.length > 24) {
    candidates.push(edge === "start" ? fullNeedle.slice(0, 24) : fullNeedle.slice(-24));
  }

  for (const needle of candidates) {
    const offsetInFragment = needle === fullNeedle || edge === "start" ? 0 : fullNeedle.length - needle.length;
    const occurrence = countOccurrences(renderedBefore + fullNeedle.slice(0, offsetInFragment), needle);
    let index = nthIndexOf(slice, needle, occurrence);
    if (index === -1) index = slice.indexOf(needle);
    if (index === -1) continue;

    const start = elementRange.start + index - offsetInFragment;
    return edge === "start" ? Math.max(elementRange.start, start) : elementRange.start + index + needle.length;
  }

  return edge === "start" ? elementRange.start : elementRange.end;
}

/** Converts a DOM selection inside the preview into a source range, or null if it isn't in the preview. */
export function selectionToSourceRange(selection: Selection, root: Element, source: string): SourceRange | null {
  if (selection.rangeCount === 0 || selection.isCollapsed) return null;

  const parts = selectedTextParts(selection.getRangeAt(0), root);
  if (parts.length === 0) return null;

  const start = locatePart(parts[0], root, source, "start");
  const end = locatePart(parts[parts.length - 1], root, source, "end");

  if (start === null || end === null) return null;

  return { start: Math.min(start, end), end: Math.max(start, end) };
}

/** Range for a plain click on an atomic element (an equation or image), so it can be jumped to. */
export function clickToSourceRange(target: EventTarget | null, root: Element): SourceRange | null {
  const atomic = target instanceof Node ? atomicAncestor(target, root) : null;

  return atomic ? readRange(atomic) : null;
}

/** The innermost preview element whose source range contains `offset`. */
export function findElementAtOffset(root: Element, offset: number) {
  let best: Element | null = null;
  let bestSize = Infinity;

  root.querySelectorAll(SOURCE_SELECTOR).forEach((element) => {
    const range = readRange(element);
    if (!range || offset < range.start || offset > range.end) return;

    const size = range.end - range.start;
    // `<=` prefers the deeper element when an inner and outer one share the same range.
    if (size <= bestSize) {
      best = element;
      bestSize = size;
    }
  });

  return best as Element | null;
}

/** A hidden div laid out exactly like the textarea's text, for measuring where characters land. */
function createTextareaMirror(textarea: HTMLTextAreaElement) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  Object.assign(mirror.style, {
    position: "absolute",
    visibility: "hidden",
    top: "0",
    left: "-9999px",
    boxSizing: "border-box",
    width: `${textarea.clientWidth}px`,
    padding: style.padding,
    border: "0",
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    tabSize: style.tabSize,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: style.wordBreak,
  });

  return mirror;
}

function createMarker() {
  const marker = document.createElement("span");
  marker.textContent = "\u200b";
  return marker;
}

/** Scrolls a textarea so `offset` sits about a third of the way down, by measuring a mirror element. */
export function scrollTextareaToOffset(textarea: HTMLTextAreaElement, offset: number) {
  const mirror = createTextareaMirror(textarea);
  const marker = createMarker();

  mirror.textContent = textarea.value.slice(0, offset);
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const top = marker.offsetTop;
  mirror.remove();

  textarea.scrollTop = Math.max(0, top - textarea.clientHeight / 3);
}

/**
 * Finds the gap between lines nearest to a pointer, so drops land on a new line instead of mid-text.
 * Returns the character offset of that gap and its y position relative to the textarea's border box.
 */
export function lineGapAtPoint(textarea: HTMLTextAreaElement, clientY: number): { offset: number; top: number } {
  const lines = textarea.value.split("\n");
  const mirror = createTextareaMirror(textarea);
  const markers: HTMLSpanElement[] = [];

  lines.forEach((line, index) => {
    const marker = createMarker();
    markers.push(marker);
    mirror.appendChild(marker);
    mirror.appendChild(document.createTextNode(index < lines.length - 1 ? `${line}\n` : line));
  });
  document.body.appendChild(mirror);

  const lineHeight = markers.length > 1 ? markers[1].offsetTop - markers[0].offsetTop || markers[0].offsetHeight : markers[0].offsetHeight;
  const lastBottom = mirror.scrollHeight - parseFloat(window.getComputedStyle(textarea).paddingBottom);
  // gapTops[i] is the y of the gap above line i; the final entry is the gap below the last line.
  const gapTops = [...markers.map((marker) => marker.offsetTop), Math.max(lastBottom, markers[markers.length - 1].offsetTop + lineHeight)];
  mirror.remove();

  const style = window.getComputedStyle(textarea);
  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const y = clientY - textarea.getBoundingClientRect().top - borderTop + textarea.scrollTop;

  let gap = 0;
  let bestDistance = Infinity;
  gapTops.forEach((gapTop, index) => {
    const distance = Math.abs(gapTop - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      gap = index;
    }
  });

  let offset = 0;
  for (let index = 0; index < gap; index += 1) offset += lines[index].length + 1;
  offset = Math.min(offset, textarea.value.length);

  return { offset, top: gapTops[gap] - textarea.scrollTop + borderTop };
}

/* ---------------------------------------------------------------------------------------------
 * Inline editing in the preview (plain text only).
 *
 * When a block starts editing, every text node in it is matched to its spot in the markdown.
 * On save, the old and new text are diffed down to the one changed span, which is mapped back
 * through those text nodes and spliced into the source. Edits that would cross formatting
 * (e.g. delete a `**` boundary or touch an equation) are rejected instead of guessed at.
 * ------------------------------------------------------------------------------------------- */

/** Blocks that can be edited in place. */
export const INLINE_EDITABLE_SELECTOR = "p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote";

export type InlineEditResult =
  | { kind: "edit"; start: number; end: number; text: string }
  | { kind: "none" }
  | { kind: "cancel" }
  | { kind: "rejected"; range: SourceRange | null };

/** Source offset of the first character of a text node, or null if it can't be pinned down exactly. */
function locateTextNode(node: Text, root: Element, source: string) {
  if (atomicAncestor(node, root)) return null;

  const element = closestSourceElement(node, root);
  const range = element ? readRange(element) : null;
  const needle = node.data.trim();

  if (!element || !range || !needle) return null;

  const leading = node.data.length - node.data.trimStart().length;
  const before = document.createRange();
  before.setStart(element, 0);
  before.setEnd(node, leading);

  const index = nthIndexOf(source.slice(range.start, range.end), needle, countOccurrences(before.toString(), needle));

  return index === -1 ? null : range.start + index - leading;
}

/** Backslash-escapes characters that would turn typed prose into markdown/MDX syntax. */
function escapeMarkdown(text: string) {
  return text.replace(/[\\`*_$<>{}[\]|]/g, "\\$&");
}

type NodeSnapshot = { data: string; src: number | null; inCode: boolean };

function diffToSourceEdit(nodes: NodeSnapshot[], oldText: string, newText: string, source: string): InlineEditResult {
  let prefix = 0;
  while (prefix < oldText.length && prefix < newText.length && oldText[prefix] === newText[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < oldText.length - prefix &&
    suffix < newText.length - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const oldEnd = oldText.length - suffix;
  if (prefix === oldEnd && newText.length - suffix === prefix) return { kind: "none" };

  // side "left": the node that owns the character *before* `offset`; "right": the one *after*.
  function map(offset: number, side: "left" | "right") {
    let cumulative = 0;

    for (const node of nodes) {
      const next = cumulative + node.data.length;
      const owns = side === "left" ? offset > cumulative && offset <= next : offset >= cumulative && offset < next;

      if (owns) return node.src === null ? null : { at: node.src + (offset - cumulative), node };
      cumulative = next;
    }

    return null;
  }

  const isInsert = prefix === oldEnd;
  const startSide = isInsert ? (prefix > 0 ? "left" : "right") : "right";
  const start = map(prefix, startSide);
  const end = isInsert ? start : map(oldEnd, "left");

  if (!start || !end || source.slice(start.at, end.at) !== oldText.slice(prefix, oldEnd)) {
    return { kind: "rejected", range: null };
  }

  const typed = newText.slice(prefix, newText.length - suffix);

  return { kind: "edit", start: start.at, end: end.at, text: start.node.inCode ? typed : escapeMarkdown(typed) };
}

/**
 * Makes `block` editable in place. Calls `onDone` once, on Enter/blur (save) or Escape (cancel).
 * `point` places the caret where the person clicked.
 */
export function beginInlineEdit(
  block: HTMLElement,
  root: Element,
  source: string,
  point: { x: number; y: number },
  onDone: (result: InlineEditResult) => void,
) {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) textNodes.push(node as Text);

  const snapshot: NodeSnapshot[] = textNodes.map((node) => ({
    data: node.data,
    src: locateTextNode(node, root, source),
    inCode: Boolean(node.parentElement?.closest("code")),
  }));
  const oldText = snapshot.map((node) => node.data).join("");
  const blockSource = closestSourceElement(block, root);
  const blockRange = blockSource ? readRange(blockSource) : null;

  // Equations/images inside the block stay untouchable.
  block.querySelectorAll("[data-src-atomic]").forEach((element) => element.setAttribute("contenteditable", "false"));
  block.setAttribute("contenteditable", "plaintext-only");
  block.setAttribute("data-src-editing", "");

  const existing = window.getSelection();
  const keptRange = existing && !existing.isCollapsed && existing.rangeCount > 0 ? existing.getRangeAt(0) : null;
  block.focus();

  const selection = window.getSelection();
  const caret = keptRange ?? document.caretRangeFromPoint?.(point.x, point.y) ?? null;
  if (selection && caret && block.contains(caret.startContainer)) {
    selection.removeAllRanges();
    selection.addRange(caret);
  }

  let finished = false;

  function finish(save: boolean) {
    if (finished) return;
    finished = true;

    block.removeEventListener("keydown", handleKeyDown);
    block.removeEventListener("blur", handleBlur);
    block.removeAttribute("contenteditable");
    block.removeAttribute("data-src-editing");

    if (!save) {
      onDone({ kind: "cancel" });
      return;
    }

    const result = diffToSourceEdit(snapshot, oldText, block.textContent ?? "", source);
    onDone(result.kind === "rejected" ? { kind: "rejected", range: blockRange } : result);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
    }
  }

  function handleBlur() {
    finish(true);
  }

  block.addEventListener("keydown", handleKeyDown);
  block.addEventListener("blur", handleBlur);
}
