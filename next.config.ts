import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Avoid jumping from 1200px to 1920px for common laptop screens.
    deviceSizes: [360, 480, 640, 750, 828, 960, 1080, 1200, 1440, 1600, 1920, 2048, 3840],
  },
  async headers() {
    return [{
      source: "/assets/optimized/static/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
};

export default nextConfig;
