import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "apqsehnfehgcygadnrgq.supabase.co",
        pathname: "/storage/v1/object/public/Assets/**",
      },
    ],
  },
};

export default nextConfig;
