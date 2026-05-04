import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin root to this directory — prevents Turbopack from scanning parent folders
    // for lockfiles (which caused the original infinite-scan / browser-hang bug)
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
