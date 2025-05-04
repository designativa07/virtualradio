/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuração para exportação estática
  distDir: '.next',
  output: 'export', // Gera arquivos HTML estáticos
  images: {
    unoptimized: true, // Necessário para output: 'export'
  },
  trailingSlash: true, // Adiciona / no final das URLs para compatibilidade com servidor estático
  
  // Desabilitando recursos do App Router que não são compatíveis com exportação estática
  experimental: {
    appDir: true,
    // Desativando RSC na exportação estática
    serverActions: false,
    serverComponents: false,
  },
};

module.exports = nextConfig; 