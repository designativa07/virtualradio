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
  
  // Configurações para desativar recursos incompatíveis com exportação estática
  experimental: {
    // Remove appDir pois já está ativado por padrão nas versões recentes
    // Remove serverComponents pois não é configurável desta forma
    serverActions: false,
  },
};

module.exports = nextConfig; 