"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentPropsWithoutRef } from "react";

/**
 * A task-list checkbox (`- [ ] …`) the reader can tick while revising. Ticks are kept in this
 * browser's localStorage, per page, keyed by the item's `data-task-id` (see rehypeTaskList).
 * Without storage (private window, blocked site data) it still toggles for the visit.
 */
const STORAGE_PREFIX = "checklist:";
const listeners = new Set<() => void>();
const memory = new Map<string, boolean>();

function read(key: string): boolean | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? null : value === "1";
  } catch {
    return null;
  }
}

function write(key: string, checked: boolean) {
  memory.set(key, checked);
  try {
    window.localStorage.setItem(key, checked ? "1" : "0");
  } catch {
    // Storage unavailable: the in-memory value still holds for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type TaskCheckboxProps = ComponentPropsWithoutRef<"input"> & { "data-task-id"?: string };

export default function TaskCheckbox({ checked, disabled, className, ...props }: TaskCheckboxProps) {
  void disabled; // GFM marks task boxes disabled; readers should be able to tick them.
  const pathname = usePathname();
  const taskId = props["data-task-id"];
  const key = `${STORAGE_PREFIX}${pathname}#${taskId}`;
  const authored = Boolean(checked);

  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const isChecked = stored ?? authored;

  return (
    <input
      {...props}
      type="checkbox"
      checked={isChecked}
      onChange={(event) => write(key, event.target.checked)}
      className={["task-checkbox", className].filter(Boolean).join(" ")}
    />
  );
}
