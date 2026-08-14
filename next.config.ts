import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pg", "@prisma/adapter-pg"],
};

export default nextConfig;
