/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use static export which is more compatible with our Express setup
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Better for static export
};

module.exports = nextConfig; 