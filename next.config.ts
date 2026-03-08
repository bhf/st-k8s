import type { NextConfig } from "next";

// Enable standalone output so Docker can copy the minimal server files
const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    CHAT_PROVIDER: process.env.CHAT_PROVIDER || "copilot",
    OPENAI_API_URL: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  },
};

export default nextConfig;
