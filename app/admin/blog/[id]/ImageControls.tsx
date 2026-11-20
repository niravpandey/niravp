"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  INSERTED_IMAGE_DEFAULTS,
  WRAPPED_IMAGE_MAX_PERCENT,
  nudgeWidth,
  parseImageSource,
  serializeImage,
  widthPercent,
  type ImageAlign,
  type ImageParams,
} from "./imageSource";
import type { SourceRange } from "./sourceSync";

type ImageControlsProps = {
  /** The rendered MDX; images in it carry `data-src-start` / `data-src-end`. */
  bodyRef: React.RefObject<HTMLDivElement | null>;
  /** Positioned scroll container the controls are placed in. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** The markdown the preview was rendered from (the DOM's offsets refer to this). */
  sourceText: string;
  /** The editor's markdown right now; ahead of `sourceText` until the preview re-renders. */
  liveSource: string;
  /** Changes whenever the preview re-renders, so the controls can follow their image. */
  renderKey: unknown;
  onEditSource: (start: number, end: number, text: string) => void;
  onJumpToSource: (range: SourceRange) => void;
};

type Placement = { range: SourceRange; top: number; left: number; width: number; frameWidth: number };
/** The text this bar last wrote for an image, so further changes can land before the preview catches up. */
type Pending = { start: number; text: string };

const EDGE_GAP = 8;
const IMAGE_SELECTOR = "img[data-src-start]";

function findImage(body: HTMLElement | null, start: number) {
  return body?.querySelector<HTMLImageElement>(`img[data-src-start="${start}"]`) ?? null;
}

function readRange(image: Element): SourceRange | null {
  const start = Number(image.getAttribute("data-src-start"));
  const end = Number(image.getAttribute("data-src-end"));
  return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
}

/** True when the range is the only thing on its line(s), so a multi-line `<BlogImage>` fits there. */
function standsAlone(source: string, { start, end }: SourceRange) {
  const before = source.lastIndexOf("\n", start - 1);
  const after = source.indexOf("\n", end);
  return !source.slice(before + 1, start).trim() && !source.slice(end, after === -1 ? undefined : after).trim();
}

/**
 * Hover controls for images in the editor preview: position, text wrap, size and caption.
 * Every change rewrites that image's markdown, so the source stays the single truth.
 *
 * Clicking an image opens the bar for it and selects the image's markdown in the editor. It stays
 * open (following the image as its layout changes) until you click somewhere else in the preview,
 * press Escape, click ×, or click a different image.
 */
export default function ImageControls({
  bodyRef,
  containerRef,
  sourceText,
  liveSource,
  renderKey,
  onEditSource,
  onJumpToSource,
}: ImageControlsProps) {
  // Images are tracked by where their source starts; rewriting one keeps its start offset.
  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [captionDraft, setCaptionDraft] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [barWidth, setBarWidth] = useState(0);
  const barRef = useRef<HTMLDivElement | null>(null);

  /**
   * Where an image's markdown is in the editor right now. Once the preview has caught up its
   * offsets are exact; before that, only an image this bar just rewrote can be found reliably.
   */
  function liveRange({ start, end }: SourceRange): (SourceRange & { text: string }) | null {
    if (sourceText === liveSource) return { start, end, text: sourceText.slice(start, end) };

    if (pending && pending.start === start && liveSource.slice(start, start + pending.text.length) === pending.text) {
      return { start, end: start + pending.text.length, text: pending.text };
    }

    return null;
  }

  const close = useCallback(() => {
    setActiveStart(null);
    setCaptionDraft(null);
  }, []);

  // Clicking an image opens the bar for it and selects its markdown in the editor.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const clicked = target?.closest("figure")?.querySelector(IMAGE_SELECTOR) ?? target?.closest(IMAGE_SELECTOR);
      const range = clicked && body!.contains(clicked) ? readRange(clicked) : null;
      if (!range) return;

      event.preventDefault();
      setActiveStart(range.start);
      onJumpToSource(liveRange(range) ?? range);
    }

    body.addEventListener("click", handleClick);
    return () => body.removeEventListener("click", handleClick);
  });

  // Closes on a click elsewhere in the preview (not the editor or sidebar), or on Escape.
  useEffect(() => {
    if (activeStart === null) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target instanceof Node ? event.target : null;
      if (!target || !containerRef.current?.contains(target) || barRef.current?.contains(target)) return;
      const figure = findImage(bodyRef.current, activeStart!)?.closest("figure");
      if (figure?.contains(target)) return;
      close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !(event.target instanceof HTMLInputElement)) close();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeStart, bodyRef, containerRef, close]);

  // Place the bar over the image's figure, and keep it there as the preview re-lays out.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const container = containerRef.current;
    if (activeStart === null || !body || !container) {
      setPlacement(null);
      return;
    }

    function measure() {
      const target = findImage(body, activeStart!);
      const range = target ? readRange(target) : null;
      if (!target || !range) {
        setPlacement(null);
        return;
      }

      const box = (target.closest("figure") ?? target).getBoundingClientRect();
      const frame = container!.getBoundingClientRect();
      setPlacement({
        range,
        top: box.top - frame.top + container!.scrollTop,
        left: box.left - frame.left,
        width: box.width,
        frameWidth: container!.clientWidth,
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    observer.observe(container);
    const image = findImage(body, activeStart);
    image?.addEventListener("load", measure);
    return () => {
      observer.disconnect();
      image?.removeEventListener("load", measure);
    };
  }, [activeStart, bodyRef, containerRef, renderKey]);

  // The bar's own width, to keep it inside the preview.
  const shown = placement !== null;
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!shown || !bar) return;
    const observer = new ResizeObserver(() => setBarWidth(bar.offsetWidth));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [shown]);

  if (!placement) return null;

  const locate = () => liveRange(placement.range);

  const located = locate();
  const params = parseImageSource(located?.text ?? sourceText.slice(placement.range.start, placement.range.end));
  if (!params) return null;
  const current = params;

  function apply(change: Partial<ImageParams>) {
    const source = locate();
    if (!source) return;

    const next = { ...current, ...change };
    const multiline = current.syntax === "jsx" ? source.text.includes("\n") : standsAlone(liveSource, source);
    const text = serializeImage(next, { preferMarkdown: current.syntax === "markdown", multiline });
    if (text === source.text) return;

    setPending({ start: source.start, text });
    onEditSource(source.start, source.end, text);
  }

  function setAlign(align: ImageAlign) {
    apply({ align, textWrap: align === "center" ? false : current.textWrap });
  }

  function toggleWrap() {
    if (current.textWrap && current.align !== "center") {
      apply({ textWrap: false });
      return;
    }

    // Wrapping needs a side, and room beside the image for the text.
    const percent = widthPercent(current.width);
    apply({
      textWrap: true,
      align: current.align === "center" ? "right" : current.align,
      width: percent === null || percent > WRAPPED_IMAGE_MAX_PERCENT ? "40%" : current.width,
    });
  }

  function commitCaption() {
    if (captionDraft !== null && captionDraft.trim() !== current.caption) apply({ caption: captionDraft.trim() });
    setCaptionDraft(null);
  }

  const wraps = current.textWrap && current.align !== "center";
  const left = Math.max(EDGE_GAP, Math.min(placement.left + EDGE_GAP, placement.frameWidth - barWidth - EDGE_GAP));
  const option = (active: boolean) =>
    active
      ? "text-gray-900 underline decoration-mauve-500 underline-offset-2"
      : "text-blue-900 hover:underline hover:decoration-gray-300 hover:underline-offset-2";

  return (
    <div
      ref={barRef}
      className="absolute z-20 flex w-max max-w-[calc(100%-1rem)] flex-wrap items-baseline gap-x-3 gap-y-1 border border-line bg-white px-2 py-1 text-xs text-gray-500 shadow-sm"
      style={{ top: placement.top + EDGE_GAP, left }}
    >
      <span className="flex gap-1.5">
        {(["left", "center", "right"] as const).map((align) => (
          <button key={align} type="button" onClick={() => setAlign(align)} className={option(current.align === align)}>
            {align}
          </button>
        ))}
      </span>

      <button type="button" onClick={toggleWrap} className={option(wraps)} title="Let text flow beside the image">
        wrap: {wraps ? "on" : "off"}
      </button>

      <span className="flex items-baseline gap-1">
        <button type="button" onClick={() => apply({ width: nudgeWidth(current.width, -1) })} className={option(false)} aria-label="Smaller">
          −
        </button>
        <span className="min-w-10 text-center text-gray-700">{/^\d+$/.test(current.width) ? `${current.width}px` : current.width}</span>
        <button type="button" onClick={() => apply({ width: nudgeWidth(current.width, 1) })} className={option(false)} aria-label="Larger">
          +
        </button>
      </span>

      <input
        type="text"
        value={captionDraft ?? current.caption}
        placeholder="caption"
        aria-label="Image caption"
        onChange={(event) => setCaptionDraft(event.target.value)}
        onBlur={commitCaption}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            setCaptionDraft(null);
            event.currentTarget.blur();
          }
        }}
        className="w-36 border-b border-line bg-transparent py-0.5 text-gray-700 outline-none placeholder:text-gray-400 focus:border-gray-500"
      />

      <button
        type="button"
        onClick={() => apply({ width: INSERTED_IMAGE_DEFAULTS.width, align: INSERTED_IMAGE_DEFAULTS.align, textWrap: false })}
        className={option(false)}
        title={`Back to ${INSERTED_IMAGE_DEFAULTS.width} wide, centred, no wrap (keeps the caption)`}
      >
        reset
      </button>
      <button type="button" onClick={() => onJumpToSource(located ?? placement.range)} className={option(false)}>
        source
      </button>
      <button type="button" onClick={close} className={option(false)} aria-label="Close image controls">
        ×
      </button>
    </div>
  );
}
