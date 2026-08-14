import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pg", "@prisma/adapter-pg"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
