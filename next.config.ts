import type { NextConfig } from "next";

// Enable standalone output so Docker can copy the minimal server files
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
