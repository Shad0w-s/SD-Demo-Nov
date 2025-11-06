/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Performance optimizations
  compress: true,
  // Code splitting optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Performance optimizations
  poweredByHeader: false,
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig

