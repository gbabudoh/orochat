import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '149.102.155.247',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
