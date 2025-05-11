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
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              connect-src 'self' http://localhost:3000 http://localhost:3001 https://virtualradio.h4xd66.easypanel.host https://fonts.googleapis.com https://fonts.gstatic.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https:;
              media-src 'self' http://localhost:3001 https://virtualradio.h4xd66.easypanel.host blob:;
              worker-src 'self' blob:;
              manifest-src 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },
  
  // Handle specific paths or extensions
  async rewrites() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Em produção, não precisamos de rewrites, pois estamos no mesmo domínio
      return [];
    }
    
    // Em desenvolvimento, redirecionamos para o backend local
    const apiBaseUrl = 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${apiBaseUrl}/uploads/:path*`
      },
      {
        source: '/favicon.ico',
        destination: `${apiBaseUrl}/favicon.ico`
      }
    ];
  },
  
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production'
      ? '' // URL relativa em produção
      : 'http://localhost:3001',
  },
};

module.exports = nextConfig; 