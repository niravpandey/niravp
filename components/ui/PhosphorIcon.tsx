import type { SVGProps } from "react";
import { cn } from "@/lib/utils";
import { PHOSPHOR_PATHS } from "./phosphorPaths";

/** Icons in use on the site. Add a path to phosphorPaths.ts before using a new one. */
export type PhosphorIconName = keyof typeof PHOSPHOR_PATHS;

type PhosphorIconProps = Omit<SVGProps<SVGSVGElement>, "children" | "name"> & {
  name: PhosphorIconName;
  size?: number | string;
};

/**
 * Filled Phosphor icon as an inline SVG in the current text colour. A numeric size is in pixels;
 * without one it's 1em, like the icon font it replaces.
 */
export default function PhosphorIcon({ name, size, className, ...props }: PhosphorIconProps) {
  const dimension = typeof size === "number" ? `${size}px` : size ?? "1em";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 256 256"
      fill="currentColor"
      width={dimension}
      height={dimension}
      {...props}
      className={cn("inline-block shrink-0", className)}
    >
      <path transform="matrix(1 0 0 -1 0 256)" d={PHOSPHOR_PATHS[name]} />
    </svg>
  );
}
