/** @type {import('next').NextConfig} */
// Configuration Next.js 14 pour le projet IMT CI1
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.neon.tech",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@neondatabase/serverless",
      "@prisma/adapter-neon",
      "@prisma/client",
    ],
  },
  // Désactive le cache disque Webpack en développement sous Windows
  // pour éliminer les erreurs ENOENT et les corruptions de modules ./vendor-chunks
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  // En-têtes de sécurité HTTP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
