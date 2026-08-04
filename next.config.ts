import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    if (!process.env.CONTEXT || process.env.CONTEXT === "production") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
