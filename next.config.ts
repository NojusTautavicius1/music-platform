import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },
  images: {
    remotePatterns: [
      { hostname: "picsum.photos" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "utfs.io" },
      { hostname: "uploadthing.com" },
    ],
  },
};

export default nextConfig;
