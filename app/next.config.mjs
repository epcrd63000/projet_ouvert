/** @type {import('next').NextConfig} */
// Configuration Next.js 14 pour le projet IMT CI1
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@neondatabase/serverless",
      "@prisma/adapter-neon",
    ],
  },
};

export default nextConfig;
