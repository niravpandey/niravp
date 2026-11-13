"use client";

import { ToolLink, ToolSection } from "./WritingToolsSidebar";

type DrawingPadToolProps = {
  open: boolean;
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
  const actions = (
    <div className="mt-2 flex justify-center gap-4">
      <ToolLink onClick={onClear}>clear</ToolLink>
      <ToolLink onClick={() => onExpandedChange(!expanded)}>{expanded ? "shrink" : "enlarge"}</ToolLink>
      <ToolLink onClick={onUpload} disabled={uploading}>
        {uploading ? "saving..." : "save to images"}
      </ToolLink>
    </div>
  );

  return (
    <ToolSection title="Sketch" open={open} onToggleOpen={onToggleOpen}>
      <div className={expanded ? "fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 p-5" : ""}>
        <div className={expanded ? "flex w-[min(88vw,960px)] flex-col border border-line bg-white p-3" : ""}>
          {expanded && <p className="mb-2 text-sm text-gray-800">Sketch</p>}
          <canvas
            ref={canvasRef}
            width={520}
            height={320}
            className="block w-full touch-none border border-line bg-white [aspect-ratio:13/8]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {actions}
        </div>
      </div>
    </ToolSection>
  );
}
