import type { CSSProperties, HTMLAttributes } from "react";

type PhosphorIconName =
  | "app-window"
  | "arrow-left"
  | "arrow-right"
  | "arrow-square-out"
  | "bookmark-simple"
  | "caret-left"
  | "caret-right"
  | "code"
  | "paper-plane-tilt"
  | "file-plus"
  | "folder"
  | "folder-open"
  | "magnifying-glass"
  | "note-pencil"
  | "folder-simple-star"
  | "floppy-disk"
  | "trash"
  | "eye"
  | "eye-slash"
  | "upload-simple";

type PhosphorIconProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  name: PhosphorIconName;
  size?: number | string;
};

export default function PhosphorIcon({
  name,
  size,
  className,
  style,
  ...props
}: PhosphorIconProps) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  const iconStyle: CSSProperties = dimension
    ? {
        width: dimension,
        height: dimension,
        fontSize: dimension,
        ...style,
      }
    : style ?? {};

  return (
    <i
      aria-hidden="true"
      {...props}
      className={[`ph-${name}-fill`, "inline-flex shrink-0 items-center justify-center leading-none", className]
        .filter(Boolean)
        .join(" ")}
      style={iconStyle}
    />
  );
}
