import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const jiti = createJiti(import.meta.url);
await jiti.import("./src/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',  
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'file.302.ai',
      },
      {
        protocol: 'https',
        hostname: 'file.302ai.cn',
      }
    ],
  },

};

export default withNextIntl(nextConfig);
