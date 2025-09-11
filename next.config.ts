import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.rodasjeffrey.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-3d7f192d5f3e48728c4bd513008aa127.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
