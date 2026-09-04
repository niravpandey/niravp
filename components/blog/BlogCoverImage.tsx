interface BlogCoverImageProps {
  src: string;
  alt: string;
}

export default function BlogCoverImage({ src, alt }: BlogCoverImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className="mx-auto mt-8 block h-auto max-h-[28rem] max-w-full object-contain object-center border border-gray-200"
    />
  );
}
