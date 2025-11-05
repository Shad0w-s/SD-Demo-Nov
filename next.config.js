/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Performance optimizations
  swcMinify: true,
  compress: true,
  // Code splitting optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

