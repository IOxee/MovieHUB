import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: isProd ? "/MovieHUB" : "" },
  basePath: isProd ? "/MovieHUB" : "",
  assetPrefix: isProd ? "/MovieHUB/" : ""
};

export default nextConfig;
