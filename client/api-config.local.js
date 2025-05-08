/**
 * Configuração local da API do VirtualRadio
 * Este arquivo é usado apenas em ambiente de desenvolvimento local
 */

// Definir a URL base da API local (usando o proxy para debug)
window.API_BASE_URL = 'http://localhost:3000/api';

// Configurações alternativas (comentadas)
// window.API_BASE_URL = 'http://localhost:3001/api'; // API direta
// window.API_BASE_URL = 'https://virtualradio.h4xd66.easypanel.host/api'; // API remota

// Função para construir URLs da API
window.getApiUrl = function(endpoint) {
  // Remover barra inicial se presente
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1);
  }
  return `${window.API_BASE_URL}/${endpoint}`;
};

// Intercept all fetch calls to handle API requests
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // If it's a call to the local API
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Normalize the URL
      const apiPath = url.split('/api/')[1];
      const newUrl = `${window.API_BASE_URL}/${apiPath}`;
      
      // Debug log
      console.log(`[API Local] Tentando: ${url} -> ${newUrl}`);
      
      // Add default headers if they don't exist
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Adicionar token de autenticação se disponível
      const token = localStorage.getItem('authToken');
      if (token && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${token}`;
        console.log(`[API Auth] Adicionando token de autenticação`);
      }
      
      // Try to use the local API
      return originalFetch(newUrl, options)
        .then(response => {
          console.log(`[API Response] ${newUrl} - Status: ${response.status}`);
          
          // Verificar resposta 401 Unauthorized
          if (response.status === 401) {
            console.warn(`[API Auth] Falha de autenticação. O token pode estar inválido ou expirado.`);
          }
          
          return response;
        })
        .catch(error => {
          console.error(`[API Error] Falha na conexão com ${newUrl}:`, error.message);
          console.error('[API Error] Detalhes do erro:', error);
          console.log('[API Fallback] Ativando modo offline para endpoint:', url);
          
          // Fallback for authentication endpoint
          if (url.includes('/auth/me')) {
            console.log('[API Fallback] Usando mock de autenticação para /auth/me');
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
          
          // Adicionando mais fallbacks para outros endpoints comuns
          if (url.includes('/api/radio') || url.includes('/radios')) {
            console.log('[API Fallback] Usando dados de rádio mockados');
            return Promise.resolve(new Response(JSON.stringify({
              message: 'Dados mockados (modo offline)',
              data: [
                { id: 1, name: 'Rádio Demo 1', status: 'active' },
                { id: 2, name: 'Rádio Demo 2', status: 'inactive' }
              ]
            }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // Para outros endpoints sem fallback, retornar o erro
          return Promise.reject(error);
        });
    }
    
    // Para chamadas não-API, usar fetch normal
    return originalFetch(url, options);
  };
})();

// Verificar a conexão com a API na inicialização
(function() {
  console.log('[API Config] Configuração API local carregada, testando conexão com:', window.API_BASE_URL);
  
  // Testar a conexão com a API
  fetch(window.API_BASE_URL + '/test')
    .then(response => response.json())
    .then(data => {
      console.log('[API Test] Conexão com API estabelecida com sucesso:', data);
      
      // Verificar se estamos usando o proxy
      if (window.API_BASE_URL.includes('3001')) {
        console.log('[API Proxy] Usando servidor proxy de debug para facilitar diagnóstico de problemas');
        console.log('[API Proxy] Acesse http://localhost:3001/ para ver o status e configurar o proxy');
      }
    })
    .catch(error => {
      console.error('[API Test] Falha ao conectar com a API:', error.message);
      console.warn('[API Warning] Servidor API local não encontrado. O aplicativo funcionará no modo offline com dados mockados.');
      
      // Sugerir iniciar o proxy se estiver usando ele
      if (window.API_BASE_URL.includes('3001')) {
        console.warn('[API Proxy] O servidor proxy parece estar offline. Inicie-o com: node api-proxy-debug.js');
      }
    });
})(); 