"use client";

import { useEffect, useRef, useState } from "react";

/** Side of the on-screen square frame, in CSS pixels. */
const VIEW = 288;
/** Side of the exported square image, in pixels. */
const OUTPUT = 1000;
const MAX_ZOOM = 4;

type Props = {
  /** Image to crop: an object URL for a new file, or a public URL for an existing headshot. */
  src: string;
  title: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (image: Blob) => void;
};

/**
 * Square (1:1) crop editor. Drag to position, zoom with the slider or scroll wheel, rotate in 90° steps.
 * The picture always covers the whole frame, so the result never has empty edges.
 */
export default function HeadshotCropper({ src, title, confirmLabel, busy = false, onCancel, onConfirm }: Props) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    // Lets the canvas export a picture loaded from the storage bucket.
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setLoadError(true);
    img.src = src;
  }, [src]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  const sideways = rotation % 180 !== 0;
  const naturalWidth = image?.naturalWidth ?? 1;
  const naturalHeight = image?.naturalHeight ?? 1;
  // Size of the picture as it sits after rotation, before scaling.
  const rotatedWidth = sideways ? naturalHeight : naturalWidth;
  const rotatedHeight = sideways ? naturalWidth : naturalHeight;
  // At zoom 1 the shorter side exactly fills the frame.
  const scale = (VIEW / Math.min(rotatedWidth, rotatedHeight)) * zoom;

  function clampOffset(x: number, y: number, nextScale = scale) {
    const maxX = Math.max(0, (rotatedWidth * nextScale - VIEW) / 2);
    const maxY = Math.max(0, (rotatedHeight * nextScale - VIEW) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }

  function changeZoom(nextZoom: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
    const nextScale = (VIEW / Math.min(rotatedWidth, rotatedHeight)) * clamped;
    setZoom(clamped);
    setOffset((current) => clampOffset(current.x, current.y, nextScale));
  }

  function rotate() {
    // Rotation swaps the picture's sides, so start from a centred, unzoomed view.
    setRotation((current) => (current + 90) % 360);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, x: offset.x, y: offset.y };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(clampOffset(drag.x + event.clientX - drag.pointerX, drag.y + event.clientY - drag.pointerY));
  }

  function exportCrop() {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Redraw exactly what the frame shows, scaled up from VIEW to OUTPUT pixels.
    const k = OUTPUT / VIEW;
    ctx.imageSmoothingQuality = "high";
    ctx.translate(OUTPUT / 2 + offset.x * k, OUTPUT / 2 + offset.y * k);
    ctx.rotate((rotation * Math.PI) / 180);
    const drawWidth = naturalWidth * scale * k;
    const drawHeight = naturalHeight * scale * k;
    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    canvas.toBlob((blob) => blob && onConfirm(blob), "image/jpeg", 0.9);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm border border-line bg-white p-4 text-gray-900 shadow-lg">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-gray-500">Drag to position. Scroll or use the slider to zoom.</p>

        <div
          className="relative mx-auto mt-3 cursor-grab touch-none overflow-hidden border border-line bg-gray-100 select-none active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (dragRef.current = null)}
          onPointerCancel={() => (dragRef.current = null)}
          onWheel={(event) => changeZoom(zoom - event.deltaY * 0.002)}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              crossOrigin="anonymous"
              className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
              style={{
                width: naturalWidth * scale,
                height: naturalHeight * scale,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`,
              }}
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
              {loadError ? "Could not load this picture." : "Loading…"}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
          <label htmlFor="headshot-zoom">Zoom</label>
          <input
            id="headshot-zoom"
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="flex-1 accent-mauve-500"
          />
          <button type="button" onClick={rotate} className="transition-opacity hover:opacity-70">
            Rotate
          </button>
        </div>

        <div className="mt-4 flex justify-end gap-3 text-sm">
          <button type="button" onClick={onCancel} disabled={busy} className="text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={exportCrop}
            disabled={!image || busy}
            className="border border-line bg-white/60 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
