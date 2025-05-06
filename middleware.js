/**
 * MyRadio API Middleware
 * 
 * Este middleware intercepta todas as requisições de API para localhost:3000/api
 * e as redireciona para o servidor de API de produção em virtualradio.h4xd66.easypanel.host
 * 
 * IMPORTANTE: O Next.js processa esse middleware ANTES de chegar nos handlers de API locais,
 * por isso não funcionará se o middleware redirecionar TODAS as chamadas. Precisamos
 * desativar esse middleware e usar os handlers locais.
 */

export function middleware(request) {
  // DESATIVADO: Agora estamos usando os handlers de API locais em vez do middleware
  // Isso permite funcionamento offline e resposta mais eficiente em desenvolvimento
  
  // Apenas para logs e diagnóstico
  const url = new URL(request.url);
  console.log(`[Middleware] Requisição API recebida: ${url.pathname}`);
  
  // Retorna null para permitir que a requisição siga para os handlers locais
  return null;
  
  /* CÓDIGO ORIGINAL (DESATIVADO)
  const url = new URL(request.url);
  
  // Apenas interceptar requisições de API
  if (url.pathname.startsWith('/api/')) {
    // Criar uma nova URL apontando para a API de produção
    const apiUrl = new URL(url.pathname.replace('/api', ''), 'https://virtualradio.h4xd66.easypanel.host/api');
    
    // Preservar parâmetros de consulta
    apiUrl.search = url.search;
    
    // Registrar o redirecionamento (visível no console do navegador)
    console.log(`Redirecionando requisição API de ${url.toString()} para ${apiUrl.toString()}`);
    
    // Redirecionar a requisição com todos os cabeçalhos
    return new Response(null, {
      status: 307,
      headers: {
        'Location': apiUrl.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
  
  // Passar adiante todas as outras requisições
  return null;
  */
}

export const config = {
  // Executar este middleware apenas para rotas de API
  matcher: '/api/:path*',
};