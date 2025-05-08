/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações gerais
  reactStrictMode: false,
  distDir: '.next',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // Configure Content Security Policy (CSP)
  async headers() {
    const cspValue = process.env.NODE_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://virtualradio.h4xd66.easypanel.host https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: data:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:3000 https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob: data:;";

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
    return [
      {
        source: '/api/:path*',
        destination: 'https://virtualradio.h4xd66.easypanel.host/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'https://virtualradio.h4xd66.easypanel.host/uploads/:path*',
      },
    ];
  },
  
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? 'https://virtualradio.h4xd66.easypanel.host'
      : 'http://localhost:3000',
  },
};

module.exports = nextConfig; 