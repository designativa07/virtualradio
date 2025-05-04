/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração padrão do Next.js sem exportação estática
  distDir: '.next',
  
  // Configure as requisições de API para apontar para o backend Express
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/:path*'
          : '/api/:path*', // Em produção, deixe o Express lidar com as requisições da API
      },
    ];
  },
};

module.exports = nextConfig; 