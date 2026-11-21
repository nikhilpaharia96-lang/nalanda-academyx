import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admins can paste any https image link in Admin → Website Content, so
    // next/image must accept remote hosts. Only admins can set these.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
