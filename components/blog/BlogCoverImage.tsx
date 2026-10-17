type BlogCoverImageProps = {
  src: string;
  alt: string;
};

/** Cover image shown at its natural aspect ratio, capped in height. */
export default function BlogCoverImage({ src, alt }: BlogCoverImageProps) {
  return (
    // A plain <img> because next/image needs fixed dimensions, and cover images vary in size.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mx-auto mt-8 block h-auto max-h-[28rem] max-w-full border border-gray-200 object-contain object-center"
    />
  );
}
