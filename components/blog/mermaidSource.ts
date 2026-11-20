import { isValidElement, type ReactNode } from "react";

/** The diagram source if `children` (of a <pre>) is a ```mermaid fenced block, else null. */
export function mermaidSource(children: ReactNode): string | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return null;
  const { className, children: text } = children.props;
  if (!className?.split(/\s+/).includes("language-mermaid") || typeof text !== "string") return null;
  return text.trim();
}
