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
  
  // Desabilitando rewrites, pois não funcionam com exportação estática
  // As chamadas de API serão configuradas diretamente nos componentes
};

module.exports = nextConfig; 