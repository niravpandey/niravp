import type { NextConfig } from "next";

const SUPABASE_HOST = "apqsehnfehgcygadnrgq.supabase.co";

const nextConfig: NextConfig = {
  images: {
    // Public Supabase storage buckets, plus Supabase's image-transform endpoint used by the gallery.
    remotePatterns: [
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/Assets/**" },
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/Gallery/**" },
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/Blog/**" },
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/render/image/public/**" },
    ],
  },
};

export default nextConfig;
