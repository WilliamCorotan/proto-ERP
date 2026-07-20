import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@erp/core", "@erp/sales", "@erp/sdk"]
};

export default nextConfig;
