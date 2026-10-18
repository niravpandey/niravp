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
  onDeleteImage: (image: BlogImage) => void;
  onSelectCoverImage: (image: BlogImage) => void;
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
  onDeleteImage,
  onSelectCoverImage,
}: BlogImagesToolProps) {
  const isIconDensity = density === "icon";
  const isComfortableDensity = density === "comfortable";

  return (
    <section className={["border border-gray-200 bg-white/60", isIconDensity ? "overflow-hidden" : ""].join(" ")}>
      <button
        type="button"
        onClick={onToggleOpen}
        className={[
          "relative flex w-full items-center text-left text-sm text-gray-800 transition-colors hover:bg-white/80",
          isIconDensity ? "h-11 justify-center px-0 py-0" : "justify-between px-3 py-2",
        ].join(" ")}
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
            className={[
              "mb-2 inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-40",
              isIconDensity ? "mx-auto h-9 w-9 px-0 py-0" : "w-full gap-2 px-2 py-1.5",
            ].join(" ")}
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
                <div key={image.path} className={["group min-w-0 border border-gray-200 bg-white", isIconDensity ? "p-1" : "flex gap-2 p-1.5"].join(" ")}>
                  <div className={["relative aspect-square shrink-0 overflow-hidden bg-gray-100", isIconDensity ? "mx-auto w-full max-w-20" : "w-12"].join(" ")}>
                    <img
                      src={image.publicUrl}
                      alt={getImageAltText(image.name)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-1 bottom-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => onInsertImage(image)}
                        title="Insert into editor"
                        className="inline-flex h-7 min-w-0 flex-1 items-center justify-center border border-gray-900 bg-white/95 text-xs font-medium text-gray-900 shadow-sm transition-colors hover:bg-white"
                      >
                        <PhosphorIcon name="plus" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCoverImage(image)}
                        title="Set as post thumbnail"
                        className="inline-flex h-7 min-w-0 flex-1 items-center justify-center border border-mauve-500 bg-mauve-500/95 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-mauve-600"
                      >
                        T
                      </button>
                    </div>
                  </div>

                  {isIconDensity ? (
                    <div className="mt-1 flex justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectCoverImage(image)}
                        title="Set as thumbnail"
                        className="inline-flex h-7 w-7 items-center justify-center border border-mauve-200 bg-white font-mono text-xs font-semibold text-mauve-700 transition-colors hover:border-mauve-500 hover:bg-mauve-50"
                      >
                        T
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteImage(image)}
                        title="Delete image"
                        className="inline-flex h-7 w-7 items-center justify-center border border-red-200 bg-white text-red-700 transition-colors hover:border-red-700 hover:bg-red-50"
                      >
                        <PhosphorIcon name="trash" size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs text-gray-500" title={image.name}>
                        {image.name}
                      </p>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectCoverImage(image)}
                          title="Set as thumbnail"
                          className="inline-flex h-7 w-7 items-center justify-center border border-mauve-200 bg-white font-mono text-xs font-semibold text-mauve-700 transition-colors hover:border-mauve-500 hover:bg-mauve-50"
                        >
                          T
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteImage(image)}
                          title="Delete image"
                          className="inline-flex h-7 w-7 items-center justify-center border border-red-200 bg-white text-red-700 transition-colors hover:border-red-700 hover:bg-red-50"
                        >
                          <PhosphorIcon name="trash" size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}