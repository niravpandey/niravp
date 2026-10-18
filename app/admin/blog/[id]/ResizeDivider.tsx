"use client";

type ResizeDividerProps = {
  ariaLabel: string;
  className?: string;
  onResize: (clientX: number) => void;
};

export default function ResizeDivider({ ariaLabel, className, onResize }: ResizeDividerProps) {
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    onResize(event.clientX);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    onResize(event.clientX);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      role="separator"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      className={[
        "group hidden cursor-col-resize touch-none items-center justify-center xl:flex",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative flex h-full w-3 items-center justify-center bg-white/80">
        <div className="h-full w-0.5 bg-gray-300 transition-colors group-hover:bg-gray-500" />
        <div className="absolute h-10 w-1.5 bg-gray-100 ring-1 ring-gray-300 transition-colors group-hover:bg-white group-hover:ring-gray-500" />
      </div>
    </div>
  );
}
