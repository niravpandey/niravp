"use client";

import Image from "next/image";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { deleteHeadshotAction, reorderHeadshotsAction, uploadHeadshotAction } from "@/app/admin/portfolio-actions";
import type { Headshot } from "@/lib/headshots";
import HeadshotCropper from "./HeadshotCropper";

/** What the cropper is open on: a newly chosen file, or an existing headshot being re-cropped. */
type CropTarget = { kind: "new"; src: string } | { kind: "existing"; headshot: Headshot; src: string };

async function uploadCropped(image: Blob, replaces?: string) {
  // Server actions accept up to 1MB; a 1000px JPEG is usually well under, but shrink it just in case.
  const file = new File([image], "headshot.jpg", { type: "image/jpeg" });
  const small = await imageCompression(file, { maxSizeMB: 0.9, maxWidthOrHeight: 1000, useWebWorker: true });
  const formData = new FormData();
  formData.append("headshot", new File([small], "headshot.jpg", { type: "image/jpeg" }));
  if (replaces) formData.append("replaces", replaces);
  await uploadHeadshotAction(formData);
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Upload, crop, reorder and remove the pictures the home page headshot rotates through.
 * The parent keys this on the headshot list, so local order resets whenever the server list changes.
 */
export default function HeadshotManager({ headshots: savedHeadshots }: { headshots: Headshot[] }) {
  const router = useRouter();
  // Shown order; changes immediately while dragging and is saved when the drag ends.
  const [headshots, setHeadshots] = useState(savedHeadshots);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // New files waiting to be cropped, one at a time in the order chosen. `src` is an object URL for previewing.
  const [queue, setQueue] = useState<{ src: string }[]>([]);
  const [editing, setEditing] = useState<Headshot | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const target: CropTarget | null = editing
    ? { kind: "existing", headshot: editing, src: editing.url }
    : queue.length > 0
      ? { kind: "new", src: queue[0].src }
      : null;

  function handleChoose(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    setError(null);
    setStatus(null);
    setQueue(files.map((file) => ({ src: URL.createObjectURL(file) })));
  }

  function closeCurrent() {
    if (target?.kind === "existing") {
      setEditing(null);
      return;
    }
    if (queue[0]) URL.revokeObjectURL(queue[0].src);
    setQueue((current) => current.slice(1));
  }

  function handleConfirm(image: Blob) {
    const current = target;
    if (!current) return;

    setError(null);
    startTransition(async () => {
      try {
        // An adjusted picture replaces the old file in the same position.
        await uploadCropped(image, current.kind === "existing" ? current.headshot.path : undefined);
        setStatus(current.kind === "existing" ? "Saved." : "Added.");
        closeCurrent();
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not save the picture.");
      }
    });
  }

  function saveOrder(next: Headshot[]) {
    const unchanged = next.every((headshot, i) => headshot.path === savedHeadshots[i]?.path);
    if (unchanged) return;

    setError(null);
    startTransition(async () => {
      try {
        await reorderHeadshotsAction(next.map((headshot) => headshot.path));
        setStatus("Order saved.");
        router.refresh();
      } catch (cause) {
        setHeadshots(savedHeadshots);
        setError(cause instanceof Error ? cause.message : "Could not save the order.");
      }
    });
  }

  function nudge(index: number, by: -1 | 1) {
    const to = index + by;
    if (to < 0 || to >= headshots.length) return;
    const next = move(headshots, index, to);
    setHeadshots(next);
    saveOrder(next);
  }

  function handleDelete(headshot: Headshot) {
    if (!window.confirm("Remove this picture from the home page?")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteHeadshotAction(headshot.path);
        setStatus("Removed.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not remove the picture.");
      }
    });
  }

  const cropTitle =
    target?.kind === "existing"
      ? "Adjust picture"
      : queue.length > 1
        ? `Crop new picture (${queue.length} left)`
        : "Crop new picture";

  return (
    <section className="mt-10 grid max-w-xl gap-4 border-b border-line pb-8">
      <div>
        <h2 className="text-sm font-medium text-gray-800">Home page headshots</h2>
        <p className="mt-1 text-sm text-gray-500">
          The home page shows one picture at a time; clicking it fades to the next. With a single picture it stays put.
          Drag pictures to change the order — the first one shows when the page loads.
        </p>
      </div>

      {headshots.length === 0 ? (
        <p className="text-sm text-gray-500">No pictures yet, so the home page is using the original headshot.png.</p>
      ) : (
        <ul className="flex flex-wrap gap-4">
          {headshots.map((headshot, i) => (
            <li
              key={headshot.path}
              draggable={!isPending && headshots.length > 1}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                setDragIndex(i);
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                if (dragIndex !== i) {
                  setHeadshots((current) => move(current, dragIndex, i));
                  setDragIndex(i);
                }
              }}
              onDrop={(event) => event.preventDefault()}
              onDragEnd={() => {
                setDragIndex(null);
                saveOrder(headshots);
              }}
              className={[
                "flex flex-col items-start gap-1",
                headshots.length > 1 ? "cursor-grab active:cursor-grabbing" : "",
                dragIndex === i ? "opacity-40" : "",
              ].join(" ")}
            >
              <div className="relative">
                <Image
                  src={headshot.url}
                  alt={`Headshot ${i + 1}`}
                  width={96}
                  height={96}
                  draggable={false}
                  className="h-24 w-24 border border-line object-cover p-0.5"
                />
                <span className="absolute top-0 left-0 bg-white/90 px-1 text-[10px] text-gray-700">{i === 0 ? "1 · first" : i + 1}</span>
              </div>
              {headshots.length > 1 && (
                <div className="flex gap-2 text-xs text-gray-500">
                  <button
                    type="button"
                    onClick={() => nudge(i, -1)}
                    disabled={isPending || i === 0}
                    aria-label={`Move picture ${i + 1} earlier`}
                    className="transition-colors hover:text-gray-900 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(i, 1)}
                    disabled={isPending || i === headshots.length - 1}
                    aria-label={`Move picture ${i + 1} later`}
                    className="transition-colors hover:text-gray-900 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setEditing(headshot)}
                  disabled={isPending}
                  className="text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50"
                >
                  Adjust
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(headshot)}
                  disabled={isPending}
                  className="text-red-700 transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleChoose} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending || target !== null}
        className="w-fit border border-line bg-white/60 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white/80 disabled:opacity-60"
      >
        Add pictures
      </button>

      {error && <p className="text-xs text-red-700">{error}</p>}
      {status && !error && <p className="text-xs text-gray-500">{status}</p>}

      {target && (
        <HeadshotCropper
          key={target.src}
          src={target.src}
          title={cropTitle}
          confirmLabel={target.kind === "existing" ? "Save" : "Add"}
          busy={isPending}
          onCancel={closeCurrent}
          onConfirm={handleConfirm}
        />
      )}
    </section>
  );
}
