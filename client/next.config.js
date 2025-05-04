/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Define API rewrites to proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/:path*'
          : 'http://localhost:3000/api/:path*', // In production this will be handled by our server
      },
    ];
  },
  // Use Next.js default output mode (not 'export')
  distDir: 'dist', // Still use dist instead of .next
};

module.exports = nextConfig; 