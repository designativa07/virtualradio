/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para produção
  output: 'standalone',
  
  // Configure Content Security Policy (CSP)
  async headers() {
    // In production, use dynamic CSP that allows same-origin connections
    const cspValue = process.env.NODE_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: data:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:3000 http://localhost:3030 https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: data:;";

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspValue
          }
        ]
      }
    ];
  },
  
  // Handle specific paths or extensions
  async rewrites() {
    // In development, rewrite API requests to localhost:3000
    // In production, this isn't needed since everything is on the same domain
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3000/api/:path*',
        },
        {
          source: '/uploads/:path*',
          destination: 'http://localhost:3000/uploads/:path*',
        },
      ];
    }
    
    // In production, rewrites aren't needed unless you have a specific setup
    return [];
  },
  
  // Configurações gerais
  reactStrictMode: false,
  distDir: '.next',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // Configurações de produção
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  // Configurações de cache
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig; 