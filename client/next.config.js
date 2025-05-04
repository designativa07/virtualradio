/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração para exportação estática
  distDir: '.next',
  images: {
    unoptimized: true, // Necessário para output: 'export'
  },
  trailingSlash: true, // Adiciona / no final das URLs para compatibilidade com servidor estático
};

module.exports = nextConfig; 