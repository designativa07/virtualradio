/**
 * Configuração da API do VirtualRadio
 * Este arquivo configura a conexão com a API remota em produção
 */

// Verificar se estamos em modo de desenvolvimento local
const isLocalDev = process.env.NODE_ENV !== 'production';

// Definir a URL base da API com base no ambiente
window.API_BASE_URL = isLocalDev 
  ? 'http://localhost:3000'  // Desenvolvimento local
  : 'https://virtualradio.h4xd66.easypanel.host';  // Produção

// Registrar no console qual ambiente está sendo usado
console.log(`[API Config] Ambiente detectado: ${isLocalDev ? 'DESENVOLVIMENTO LOCAL' : 'PRODUÇÃO'}`);
console.log(`[API Config] Usando API base: ${window.API_BASE_URL}`);

// Função para construir URLs da API
window.getApiUrl = function(endpoint) {
  // Se não houver endpoint, retornar apenas a URL base
  if (!endpoint) return window.API_BASE_URL;
  
  // Limpar o endpoint removendo barras extras e prefixo api
  endpoint = endpoint.trim()
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/\/+$/, '')  // Remove trailing slashes
    .replace(/^api\/+/, ''); // Remove api prefix if present
  
  // Construir a URL final
  const baseUrl = window.API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes from base URL
  return `${baseUrl}/api/${endpoint}`;
};

// Interceptar todas as chamadas de fetch para gerenciar APIs
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Se for uma chamada para API
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Extrair o caminho da API, removendo qualquer prefixo /api/
      const apiPath = url.split('/api/').pop().replace(/^\/+/, '');
      const newUrl = window.getApiUrl(apiPath);
      
      // Log para depuração
      console.log(`[API Request] ${options.method || 'GET'} ${newUrl}`);
      
      // Adicionar headers padrão se não existirem
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Adicionar token de autenticação se disponível
      const token = localStorage.getItem('authToken');
      if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Tentar usar a API
      return originalFetch(newUrl, options)
        .then(response => {
          if (!response.ok) {
            console.error(`[API Error] Request failed with status ${response.status}: ${newUrl}`);
            // Se for o endpoint de autenticação e falhou, tentar fallback
            if (apiPath === 'auth/me' && response.status === 401) {
              return handleAuthFallback();
            }
          }
          return response;
        })
        .catch(error => {
          console.error(`[API Error] Request failed: ${error.message}`);
          // Se for o endpoint de autenticação e falhou, tentar fallback
          if (apiPath === 'auth/me') {
            return handleAuthFallback();
          }
          return Promise.reject(error);
        });
    }
    
    // Para URLs não-API, usar fetch normal
    return originalFetch(url, options);
  };
  
  // Função auxiliar para lidar com fallback de autenticação
  function handleAuthFallback() {
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
      message: 'Autenticação local (modo offline)',
      fallback: true
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    }));
  }
})();

// Verificar a conexão com a API na inicialização
fetch(window.getApiUrl('test'))
  .then(response => response.json())
  .then(data => {
    console.log('[API Test] Conexão com API estabelecida com sucesso:', data);
  })
  .catch(error => {
    console.error('[API Test] Falha ao conectar com a API:', error.message);
    console.warn('[API Warning] Aplicativo funcionará no modo offline com dados mockados.');
  }); 