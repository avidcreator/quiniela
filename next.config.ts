import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve player avatars (Supabase public storage) through Next's image
    // optimizer so they're cached with a long TTL and don't reload repeatedly.
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
