/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@crm/shared-types', '@crm/validators', '@crm/business-rules'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@crm/shared-types',
      '@crm/validators',
      '@crm/business-rules',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
