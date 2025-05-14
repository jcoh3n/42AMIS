import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: ['cdn.intra.42.fr', 'profile.intra.42.fr'],
  },
};

export default nextConfig;
