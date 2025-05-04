/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desativar a verificação rígida de rotas dinâmicas durante a exportação estática
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true, // Obrigatório para exportação estática
  },
  trailingSlash: true, // Melhor para exportação estática
  
  // Esta configuração contorna limitações da exportação estática para rotas dinâmicas
  // Criar uma página 404 para capturar requisições de rotas dinâmicas
  // O JavaScript do cliente manipulará a navegação para a página correta
  experimental: {
    // Permitir URLs arbitrárias em exportação estática
    strictDynamicRoutes: false,
  },
};

module.exports = nextConfig; 