/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static HTML export
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  
  // Configure Content Security Policy (CSP)
  async headers() {
    // In production, use dynamic CSP that allows same-origin connections
    const cspValue = process.env.NODE_ENV === 'production'
      ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:;"
      : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' http://localhost:3000 http://localhost:3030 https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:;";

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
      ];
    }
    
    // In production, rewrites aren't needed unless you have a specific setup
    return [];
  },
  
  // Disable React StrictMode for development
  reactStrictMode: false,
  // Configuração para exportação estática
  distDir: '.next',
  images: {
    unoptimized: true, // Necessário para output: 'export'
  },
  trailingSlash: true, // Adiciona / no final das URLs para compatibilidade com servidor estático
};

module.exports = nextConfig; 