import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages && { output: "export" }),

  images: { unoptimized: true },

  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? "/MovieHUB" : "",
  },

  basePath: isGithubPages ? "/MovieHUB" : "",
  assetPrefix: isGithubPages ? "/MovieHUB/" : "",
  trailingSlash: true
};

export default nextConfig;
