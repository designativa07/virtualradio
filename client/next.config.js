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
          : '/api/:path*', // In production, let Express handle the API requests
      },
    ];
  },
  // Use standard output mode (not static export)
  distDir: '.next', // Use standard Next.js directory
};

module.exports = nextConfig; 