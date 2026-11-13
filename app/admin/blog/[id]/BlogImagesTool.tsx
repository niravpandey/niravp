"use client";

import { BLOG_IMAGE_DRAG_TYPE, BLOG_IMAGE_LIMIT, getImageAltText, type BlogImage } from "./editorUtils";
import { ToolLink, ToolSection } from "./WritingToolsSidebar";

type BlogImagesToolProps = {
  open: boolean;
  images: BlogImage[];
  loading: boolean;
  error: string | null;
  status: string | null;
  coverImage: string;
  content: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onToggleOpen: () => void;
  onUploadChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInsertImage: (image: BlogImage) => void;
  onDeleteImage: (image: BlogImage) => void;
  onSelectCoverImage: (image: BlogImage) => void;
};

export default function BlogImagesTool({
  open,
  images,
  loading,
  error,
  status,
  coverImage,
  content,
  inputRef,
  onToggleOpen,
  onUploadChange,
  onInsertImage,
  onDeleteImage,
  onSelectCoverImage,
}: BlogImagesToolProps) {
  return (
    <ToolSection title="Images" meta={`latest ${BLOG_IMAGE_LIMIT}`} open={open} onToggleOpen={onToggleOpen}>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onUploadChange} />

      <p className="mb-2 text-xs text-gray-500">Click a picture to insert it at the cursor, or drag it into the editor.</p>
      <ToolLink onClick={() => inputRef.current?.click()} disabled={loading} className="mb-3">
        {loading ? "working..." : "+ upload images"}
      </ToolLink>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {status && <p className="mb-2 text-xs text-gray-500">{status}</p>}

      {images.length === 0 ? (
        <p className="text-xs text-gray-500">{loading ? "Loading images..." : "No blog images yet."}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-2 gap-y-3">
          {images.map((image) => {
            const alt = getImageAltText(image.name);
            const isCover = image.publicUrl === coverImage;
            const inPost = content.includes(image.publicUrl);

            return (
              <li key={image.path} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onInsertImage(image)}
                  draggable
                  onDragStart={(event) => {
                    // Only a custom type (no text/plain), so the editor places it on a line gap itself.
                    event.dataTransfer.setData(BLOG_IMAGE_DRAG_TYPE, image.path);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  title={`Insert “${alt}” at cursor, or drag into the editor`}
                  className={[
                    "relative block aspect-square w-full cursor-grab overflow-hidden border bg-gray-100 active:cursor-grabbing",
                    isCover ? "border-mauve-500" : "border-line hover:border-gray-500",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.publicUrl} alt={alt} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
                  {(isCover || inPost) && (
                    <span className="absolute left-0 top-0 bg-white/90 px-1 text-[10px] text-gray-700">
                      {[isCover && "cover", inPost && "in post"].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </button>
                <p className="mt-1 truncate text-[11px] text-gray-500" title={image.name}>
                  {alt}
                </p>
                <div className="flex gap-2">
                  <ToolLink onClick={() => onSelectCoverImage(image)} disabled={isCover}>
                    {isCover ? "cover" : "set cover"}
                  </ToolLink>
                  <ToolLink onClick={() => onDeleteImage(image)} className="text-red-700">
                    delete
                  </ToolLink>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ToolSection>
  );
}
