import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const headers: { source: string; headers: { key: string; value: string }[] }[] = [{
      source: "/espace/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
    }];
    if (process.env.CONTEXT && process.env.CONTEXT !== "production") {
      headers.push({ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] });
    }
    return headers;
  },
};

export default nextConfig;
