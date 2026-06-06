import type { ComponentPropsWithoutRef } from "react";

type BlogImageProps = Omit<ComponentPropsWithoutRef<"img">, "width"> & {
  align?: "left" | "center" | "right";
  caption?: string;
  textWrap?: boolean;
  width?: number | string;
};

function getRenderedImageWidth(width: BlogImageProps["width"]) {
  if (typeof width === "number") {
    return `${width}px`;
  }

  if (typeof width === "string" && /^\d+$/.test(width)) {
    return `${width}px`;
  }

  if (typeof width === "string" && width.trim()) {
    return width;
  }

  return "100%";
}

function getImageMargin(align: BlogImageProps["align"]) {
  if (align === "left") {
    return { marginLeft: 0, marginRight: "auto" };
  }

  if (align === "right") {
    return { marginLeft: "auto", marginRight: 0 };
  }

  return { marginLeft: "auto", marginRight: "auto" };
}

function getImageFloatStyle(align: BlogImageProps["align"], textWrap: boolean) {
  if (!textWrap || align === "center") {
    return {};
  }

  if (align === "right") {
    return {
      float: "right" as const,
      margin: "0 0 1rem 1.5rem",
    };
  }

  return {
    float: "left" as const,
    margin: "0 1.5rem 1rem 0",
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
  const floatStyle = getImageFloatStyle(align, textWrap);
  const shouldWrapText = Object.keys(floatStyle).length > 0;

  return (
    <figure
      className={shouldWrapText ? "my-0 block" : "my-8 block"}
      style={{
        width: getRenderedImageWidth(width),
        maxWidth: "100%",
        ...(shouldWrapText ? floatStyle : getImageMargin(align)),
      }}
    >
      <img
        className={["m-0 block h-auto w-full", className].filter(Boolean).join(" ")}
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
