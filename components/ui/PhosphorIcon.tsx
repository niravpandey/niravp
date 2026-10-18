import type { CSSProperties, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Icons in use on the site. Add a name here before using a new one. */
export type PhosphorIconName =
  | "arrow-counter-clockwise"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "book-open"
  | "caret-down"
  | "caret-left"
  | "caret-right"
  | "caret-up"
  | "clock"
  | "code"
  | "file-plus"
  | "file-text"
  | "folder"
  | "folder-open"
  | "folder-simple-star"
  | "globe-hemisphere-west"
  | "magnifying-glass"
  | "note-pencil"
  | "paint-brush"
  | "paper-plane-tilt"
  | "pause"
  | "pencil-simple"
  | "play"
  | "plus"
  | "trash"
  | "upload-simple"
  | "x";

type PhosphorIconProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  name: PhosphorIconName;
  size?: number | string;
};

/** Filled Phosphor icon rendered from the icon font. A numeric size is in pixels. */
export default function PhosphorIcon({ name, size, className, style, ...props }: PhosphorIconProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const iconStyle: CSSProperties = dimension ? { width: dimension, height: dimension, fontSize: dimension, ...style } : style ?? {};

  return (
    <i
      aria-hidden="true"
      {...props}
      className={cn(`ph-${name}-fill`, "inline-flex shrink-0 items-center justify-center leading-none", className)}
      style={iconStyle}
    />
  );
}
