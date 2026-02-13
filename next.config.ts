import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    E2E_TEST_MODE: process.env.E2E_TEST_MODE || 'false',
  },
};

export default nextConfig;
