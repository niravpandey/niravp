import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "apqsehnfehgcygadnrgq.supabase.co",
        pathname: "/storage/v1/object/public/Assets/**",
      },
      {
        protocol: "https",
        hostname: "apqsehnfehgcygadnrgq.supabase.co",
        pathname: "/storage/v1/object/public/Gallery/**",
      },
      {
        protocol: 'https',
        hostname: 'apqsehnfehgcygadnrgq.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
  },

};

export default nextConfig;


