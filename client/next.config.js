/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy API requests to Express server in development
      },
    ];
  },
  output: 'export', // For static HTML export
  distDir: 'dist', // Use dist instead of .next
};

module.exports = nextConfig; 