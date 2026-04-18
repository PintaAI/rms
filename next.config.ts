import type { NextConfig } from "next";

const devOrigins = [
  "100.108.102.102",
  "192.168.0.102",
  "localhost",
  "127.0.0.1",
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: process.env.DEV_MODE === "true"
    ? devOrigins
    : ["100.108.102.102"],
};

export default nextConfig;