import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cn } from "@/lib/utils";

type BlogImageProps = Omit<ComponentPropsWithoutRef<"img">, "width"> & {
  align?: "left" | "center" | "right";
  caption?: string;
  textWrap?: boolean;
  width?: number | string;
};

/** Plain numbers (or numeric strings) are pixels; any other CSS width passes through. */
function toCssWidth(width: BlogImageProps["width"]) {
  if (typeof width === "number" || /^\d+$/.test(width ?? "")) return `${width}px`;
  return width?.trim() || "100%";
}

/** Floated layout when text should wrap beside the image, otherwise a block aligned with margins. */
function getPlacementStyle(align: NonNullable<BlogImageProps["align"]>, textWrap: boolean): CSSProperties {
  if (textWrap && align === "left") return { float: "left", margin: "0 1.5rem 1rem 0" };
  if (textWrap && align === "right") return { float: "right", margin: "0 0 1rem 1.5rem" };

  return {
    marginLeft: align === "left" ? 0 : "auto",
    marginRight: align === "right" ? 0 : "auto",
  };
}

export default function BlogImage({
  align = "center",
  alt,
  caption,
  className,
  style,
  textWrap = false,
  width = "100%",
  ...props
}: BlogImageProps) {
  const isFloated = textWrap && align !== "center";

  return (
    <figure
      className={isFloated ? "my-0 block" : "my-8 block"}
      style={{ width: toCssWidth(width), maxWidth: "100%", ...getPlacementStyle(align, textWrap) }}
    >
      {/* A plain <img> because MDX images can come from any host at any size, which next/image can't take. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cn("m-0 block h-auto max-h-[28rem] w-full object-contain object-center", className)}
        style={{
          ...style,
          width: "100%",
          maxWidth: "100%",
          height: "auto",
        }}
        alt={alt ?? ""}
        {...props}
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm leading-6 text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
