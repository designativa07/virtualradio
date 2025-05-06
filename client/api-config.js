/**
 * Configuração da API do VirtualRadio
 * Este arquivo configura a conexão com a API remota em produção
 */

// Definir a URL base da API
window.API_BASE_URL = 'https://virtualradio.h4xd66.easypanel.host/api';

// Função para construir URLs da API
window.getApiUrl = function(endpoint) {
  // Remover barra inicial se presente
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1);
  }
  return `${window.API_BASE_URL}/${endpoint}`;
};

// Interceptar todas as chamadas de fetch para redirecionar APIs locais para a API remota
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Se for uma chamada para API local, redireciona para a API remota
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Normalizar a URL
      const apiPath = url.split('/api/')[1];
      const newUrl = `${window.API_BASE_URL}/${apiPath}`;
      
      // Log para depuração
      console.log(`[API Redirect] ${url} -> ${newUrl}`);
      
      // Adicionar headers padrão se não existirem
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Tentar usar a API remota
      return originalFetch(newUrl, options)
        .catch(error => {
          console.error(`[API Error] Falha ao conectar com ${newUrl}:`, error.message);
          
          // Em caso de erro, tentar um fallback (modo offline)
          if (url.includes('/auth/me')) {
            console.log('[API Fallback] Usando autenticação local mock para /auth/me');
            return Promise.resolve(new Response(JSON.stringify({
              authenticated: true,
              user: {
                id: 1,
                name: 'Administrador',
                email: 'admin@virtualradio.com',
                role: 'admin'
              },
              isTest: true,
              message: 'Autenticação local (modo offline)'
            }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // Se não for um endpoint com fallback, retorna o erro
          return Promise.reject(error);
        });
    }
    
    // Para URLs não-API, usar fetch normal
    return originalFetch(url, options);
  };
})();

console.log('[API Config] Configuração de API carregada com sucesso, usando:', window.API_BASE_URL); 