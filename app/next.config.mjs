/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.intra.42.fr',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'profile.intra.42.fr',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig; 