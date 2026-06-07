"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { BLOG_IMAGE_LIMIT, getImageAltText, type BlogImage, type ToolDensity } from "./editorUtils";

type BlogImagesToolProps = {
  open: boolean;
  density: ToolDensity;
  images: BlogImage[];
  loading: boolean;
  error: string | null;
  status: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onToggleOpen: () => void;
  onUploadChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInsertImage: (image: BlogImage) => void;
};

export default function BlogImagesTool({
  open,
  density,
  images,
  loading,
  error,
  status,
  inputRef,
  onToggleOpen,
  onUploadChange,
  onInsertImage,
}: BlogImagesToolProps) {
  const isIconDensity = density === "icon";
  const isComfortableDensity = density === "comfortable";

  return (
    <section className={["border border-gray-200 bg-white/60", isIconDensity ? "overflow-hidden" : ""].join(" ")}>
      <button
        type="button"
        onClick={onToggleOpen}
        className={["relative flex w-full items-center text-left text-sm text-gray-800 transition-colors hover:bg-white/80", isIconDensity ? "h-11 justify-center px-0 py-0" : "justify-between px-3 py-2"].join(" ")}
        title={isIconDensity ? `Blog images · Latest ${BLOG_IMAGE_LIMIT}` : undefined}
      >
        <span className={["inline-flex min-w-0 items-center justify-center", isIconDensity ? "h-8 w-8" : "gap-2"].join(" ")}>
          <PhosphorIcon name="folder-open" size={isIconDensity ? 18 : 16} />
          {!isIconDensity && <span className="truncate">{density === "compact" ? "Images" : "Blog images"}</span>}
        </span>
        {isIconDensity && <span className="absolute right-1.5 top-1.5 font-mono text-[10px] text-gray-400">{BLOG_IMAGE_LIMIT}</span>}
        {!isIconDensity && <span className="shrink-0 text-xs text-gray-400">{isComfortableDensity ? `Latest ${BLOG_IMAGE_LIMIT}` : BLOG_IMAGE_LIMIT}</span>}
      </button>

      {open && (
        <div className={["border-t border-gray-200", isIconDensity ? "p-2" : "p-3"].join(" ")}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onUploadChange}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            title={isIconDensity ? (loading ? "Working..." : "Upload images") : undefined}
            className={["mb-2 inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-40", isIconDensity ? "mx-auto h-9 w-9 px-0 py-0" : "w-full gap-2 px-2 py-1.5"].join(" ")}
          >
            <PhosphorIcon name="upload-simple" size={16} />
            {!isIconDensity && <span>{loading ? "Working..." : density === "compact" ? "Upload" : "Upload images"}</span>}
          </button>

          {error && <p className="mb-2 border border-red-200 bg-white/70 px-2 py-1.5 text-xs text-red-500">{error}</p>}
          {status && <p className="mb-2 border border-green-200 bg-white/70 px-2 py-1.5 text-xs text-green-600">{status}</p>}

          <div className={["flex max-h-80 flex-col overflow-y-auto", isIconDensity ? "gap-1.5 pr-0" : "gap-2 pr-1"].join(" ")}>
            {images.length === 0 ? (
              <div className="border border-gray-200 bg-white/70 p-3 text-xs text-gray-500">
                {loading ? "Loading images..." : "No blog images yet."}
              </div>
            ) : (
              images.map((image) => (
                <div key={image.path} className={["group flex min-w-0 border border-gray-200 bg-white", isIconDensity ? "justify-center p-1" : "gap-2 p-1.5"].join(" ")}>
                  <div className={["relative shrink-0 overflow-hidden bg-gray-100", isIconDensity ? "h-12 w-full" : "h-10 w-11"].join(" ")}>
                    <img
                      src={image.publicUrl}
                      alt={getImageAltText(image.name)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => onInsertImage(image)}
                      title="Add image"
                      className={["absolute inset-1 inline-flex items-center justify-center border border-gray-900 bg-white/90 text-xs font-medium text-gray-900 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100", isIconDensity ? "gap-0 px-0 py-0" : "gap-1 px-1.5 py-1"].join(" ")}
                    >
                      <PhosphorIcon name="file-plus" size={13} />
                      {!isIconDensity && <span>Add</span>}
                    </button>
                  </div>
                  {!isIconDensity && <div className="flex min-w-0 flex-1 items-center">
                    <p className="truncate text-xs text-gray-500" title={image.name}>
                      {image.name}
                    </p>
                  </div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
