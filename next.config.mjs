/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['image.tmdb.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '**',
      },
    ],
  },
  // Optimisations de performance sans critters
  experimental: {
    // Suppression de optimizeCss qui nécessite critters
    scrollRestoration: true,
    optimisticClientCache: true,
  },
  // Compression des assets
  compress: true,
  // Optimisation des polices
  optimizeFonts: true,
  // Cache des pages
  staticPageGenerationTimeout: 120,
  // Optimisation des images
  swcMinify: true,
};

export default nextConfig;
