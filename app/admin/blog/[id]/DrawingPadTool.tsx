"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { ToolDensity } from "./editorUtils";

type DrawingPadToolProps = {
  open: boolean;
  density: ToolDensity;
  expanded: boolean;
  uploading: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onToggleOpen: () => void;
  onExpandedChange: (expanded: boolean) => void;
  onPointerDown: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLCanvasElement>) => void;
  onClear: () => void;
  onUpload: () => void;
};

export default function DrawingPadTool({
  open,
  density,
  expanded,
  uploading,
  canvasRef,
  onToggleOpen,
  onExpandedChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClear,
  onUpload,
}: DrawingPadToolProps) {
  const isIconDensity = density === "icon";
  const isComfortableDensity = density === "comfortable";

  return (
    <section className={["mt-3 border border-gray-200 bg-white/60", isIconDensity ? "overflow-hidden" : ""].join(" ")}>
      <button
        type="button"
        onClick={onToggleOpen}
        className={["relative flex w-full items-center text-left text-sm text-gray-800 transition-colors hover:bg-white/80", isIconDensity ? "h-11 justify-center px-0 py-0" : "justify-between px-3 py-2"].join(" ")}
        title={isIconDensity ? "Drawing pad" : undefined}
      >
        <span className={["inline-flex min-w-0 items-center justify-center", isIconDensity ? "h-8 w-8" : "gap-2"].join(" ")}>
          <PhosphorIcon name="paint-brush" size={isIconDensity ? 18 : 16} />
          {!isIconDensity && <span className="truncate">{density === "compact" ? "Draw" : "Drawing pad"}</span>}
        </span>
        {isIconDensity && expanded && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 bg-blue-900" />}
        {!isIconDensity && <span className="shrink-0 text-xs text-gray-400">{expanded ? "Expanded" : isComfortableDensity ? "Upload to Blog" : "Upload"}</span>}
      </button>

      {open && (
        <div className={expanded ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-5 backdrop-blur-sm" : ["border-t border-gray-200", isIconDensity ? "p-2" : "p-3"].join(" ")}>
          <div className={expanded ? "relative flex h-[min(78vh,720px)] w-[min(88vw,960px)] flex-col border border-gray-200 bg-white p-3 shadow-2xl" : ""}>
            <div className={expanded ? "mb-3 flex items-center justify-between border-b border-gray-200 pb-2" : ["mb-2 flex", isIconDensity ? "justify-center" : "justify-end"].join(" ")}>
              {expanded && (
                <div>
                  <p className="text-sm font-medium text-gray-800">Drawing pad</p>
                  {isComfortableDensity && <p className="mt-0.5 text-xs text-gray-400">Same canvas, larger workspace</p>}
                </div>
              )}
              <button
                type="button"
                aria-label={expanded ? "Minimize drawing pad" : "Maximize drawing pad"}
                onClick={() => onExpandedChange(!expanded)}
                className="inline-flex h-8 w-8 items-center justify-center border border-gray-300 bg-white/50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-white/80"
              >
                <PhosphorIcon name={expanded ? "caret-right" : "arrow-square-out"} size={15} />
              </button>
            </div>
            <div className={expanded ? "flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-3" : ""}>
              <canvas
                ref={canvasRef}
                width={520}
                height={320}
                className={expanded ? "block touch-none border border-gray-200 bg-white [aspect-ratio:13/8]" : "block w-full touch-none border border-gray-200 bg-white [aspect-ratio:13/8]"}
                style={expanded ? { width: "min(100%, calc((78vh - 7rem) * 1.625))", height: "auto" } : undefined}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              />
            </div>
            <div className={["mt-2 flex justify-center", isIconDensity ? "gap-2" : "gap-2"].join(" ")}>
              <button
                type="button"
                onClick={onClear}
                title="Clear"
                className={["inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80", isIconDensity ? "h-9 w-9 px-0 py-0" : "flex-1 px-2 py-1.5"].join(" ")}
              >
                {isIconDensity ? <PhosphorIcon name="trash" size={15} /> : "Clear"}
              </button>
              <button
                type="button"
                onClick={onUpload}
                disabled={uploading}
                title={uploading ? "Uploading..." : "Upload"}
                className={["inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-40", isIconDensity ? "h-9 w-9 px-0 py-0" : "flex-1 px-2 py-1.5"].join(" ")}
              >
                {isIconDensity ? <PhosphorIcon name="upload-simple" size={15} /> : uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
