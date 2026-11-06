/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
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
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
