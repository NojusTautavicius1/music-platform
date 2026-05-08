import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: appRoot,
  },
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "framer-motion"],
  },
  images: {
    localPatterns: [
      { pathname: "/api/og" },
      { pathname: "/covers/**" },
      { pathname: "/audio/**" },
    ],
    remotePatterns: [
      { hostname: "picsum.photos" },
      { hostname: "placehold.co" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "utfs.io" },
      { hostname: "uploadthing.com" },
      { hostname: "*.ufs.sh" },
      { hostname: "npxwutpsi4.ufs.sh" },
    ],
  },
};

export default nextConfig;
