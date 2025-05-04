/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Conditionally apply configurations based on environment
  ...(process.env.NODE_ENV === 'development' 
    ? {
        // Only use rewrites in development
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: 'http://localhost:3000/api/:path*', // Proxy API requests to Express server in development
            },
          ];
        }
      } 
    : {
        // Use export in production
        output: 'export',
        distDir: 'dist', // Use dist instead of .next
      }
  )
};

module.exports = nextConfig; 