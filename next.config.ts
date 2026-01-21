import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para ambiente Lasy
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;