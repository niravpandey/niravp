/**
 * Reads and writes the markdown for one image, so the preview's image controls can change its
 * parameters by rewriting the source. Handles both `![alt](src "title")` and `<BlogImage ... />`.
 *
 * Only string attributes and bare booleans are written: next-mdx-remote strips `{...}` expressions.
 */

export type ImageAlign = "left" | "center" | "right";

export type ImageParams = {
  src: string;
  alt: string;
  /** CSS width: "60%", or plain digits for pixels. */
  width: string;
  align: ImageAlign;
  textWrap: boolean;
  caption: string;
  /** Attributes the controls don't manage (e.g. className), written back untouched. */
  extra: string[];
};

/** What BlogImage renders when a parameter is left out; these are omitted when writing. */
export const BLOG_IMAGE_DEFAULTS = { width: "100%", align: "center", textWrap: false, caption: "" } as const;

/** Parameters for a freshly inserted image. */
export const INSERTED_IMAGE_DEFAULTS = { width: "60%", align: "center", textWrap: false, caption: "" } as const;

/** Width a wrapped image snaps to when it was wider than this (text beside a huge image is unreadable). */
export const WRAPPED_IMAGE_MAX_PERCENT = 50;

const MARKDOWN_IMAGE = /^!\[([^\]]*)\]\(\s*<?([^\s>)]+)>?(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)$/;
const JSX_IMAGE = /^<(?:BlogImage|img)\b([\s\S]*?)\/?>$/;
const JSX_ATTRIBUTE = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g;

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function encodeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function toAlign(value: string | undefined): ImageAlign {
  return value === "left" || value === "right" ? value : "center";
}

function withDefaults(src: string, alt: string): ImageParams {
  return { src, alt, ...BLOG_IMAGE_DEFAULTS, extra: [] };
}

export function parseImageSource(text: string): (ImageParams & { syntax: "markdown" | "jsx" }) | null {
  const trimmed = text.trim();

  const markdown = trimmed.match(MARKDOWN_IMAGE);
  if (markdown) {
    const title = markdown[3] ?? markdown[4];
    const extra = title ? [`title="${encodeAttribute(title)}"`] : [];
    return { ...withDefaults(markdown[2], markdown[1]), extra, syntax: "markdown" };
  }

  const jsx = trimmed.match(JSX_IMAGE);
  if (!jsx) return null;

  const params: ImageParams = withDefaults("", "");

  for (const match of jsx[1].matchAll(JSX_ATTRIBUTE)) {
    const [raw, name, doubleQuoted, singleQuoted, expression] = match;
    const isBare = doubleQuoted === undefined && singleQuoted === undefined && expression === undefined;
    const value = decodeEntities(doubleQuoted ?? singleQuoted ?? expression?.trim().replace(/^["']|["']$/g, "") ?? "");

    switch (name) {
      case "src":
        params.src = value;
        break;
      case "alt":
        params.alt = value;
        break;
      case "width":
        params.width = value || BLOG_IMAGE_DEFAULTS.width;
        break;
      case "align":
        params.align = toAlign(value);
        break;
      case "caption":
        params.caption = value;
        break;
      case "textWrap":
        params.textWrap = isBare || value === "true";
        break;
      default:
        params.extra.push(raw);
    }
  }

  return params.src ? { ...params, syntax: "jsx" } : null;
}

function isDefault(params: ImageParams) {
  return (
    params.width === BLOG_IMAGE_DEFAULTS.width &&
    params.align === BLOG_IMAGE_DEFAULTS.align &&
    !params.textWrap &&
    params.extra.length === 0
  );
}

/**
 * Writes an image back out. Plain images stay as markdown when they were markdown; anything with
 * parameters becomes `<BlogImage />`, one attribute per line when `multiline`.
 */
export function serializeImage(params: ImageParams, options: { preferMarkdown?: boolean; multiline?: boolean } = {}) {
  if (options.preferMarkdown && isDefault(params) && !params.caption && !/[()\s]/.test(params.src) && !/[[\]]/.test(params.alt)) {
    return `![${params.alt}](${params.src})`;
  }

  const attributes = [`src="${encodeAttribute(params.src)}"`, `alt="${encodeAttribute(params.alt)}"`];
  if (params.width !== BLOG_IMAGE_DEFAULTS.width) attributes.push(`width="${encodeAttribute(params.width)}"`);
  if (params.align !== BLOG_IMAGE_DEFAULTS.align) attributes.push(`align="${params.align}"`);
  // Wrapping only does anything beside a left/right image.
  if (params.textWrap && params.align !== "center") attributes.push("textWrap");
  if (params.caption) attributes.push(`caption="${encodeAttribute(params.caption)}"`);
  attributes.push(...params.extra);

  return options.multiline
    ? ["<BlogImage", ...attributes.map((attribute) => `  ${attribute}`), "/>"].join("\n")
    : `<BlogImage ${attributes.join(" ")} />`;
}

/** The width as a whole percentage, or null for pixel/other widths. */
export function widthPercent(width: string) {
  const match = width.trim().match(/^(\d+(?:\.\d+)?)%$/);
  return match ? Number(match[1]) : null;
}

/** Steps a width up or down: 10% at a time for percentages, 40px for pixel widths. */
export function nudgeWidth(width: string, direction: 1 | -1) {
  const percent = widthPercent(width);
  if (percent !== null) {
    const stepped = Math.round(percent / 10) * 10 + direction * 10;
    return `${Math.min(100, Math.max(10, stepped))}%`;
  }

  const pixels = width.trim().match(/^(\d+)(?:px)?$/);
  if (pixels) return String(Math.max(40, Number(pixels[1]) + direction * 40));

  return direction > 0 ? "100%" : "50%";
}
