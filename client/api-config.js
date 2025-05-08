/**
 * Configuração da API do VirtualRadio
 * Este arquivo configura a conexão com a API remota em produção
 */

// Verificar se estamos em modo de desenvolvimento local
const isLocalDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

// Definir a URL base da API com base no ambiente
window.API_BASE_URL = isLocalDev 
  ? 'http://localhost:3000/api'  // Desenvolvimento local
  : 'https://virtualradio.h4xd66.easypanel.host/api';  // Produção

// Registrar no console qual ambiente está sendo usado
console.log(`[API Config] Ambiente detectado: ${isLocalDev ? 'DESENVOLVIMENTO LOCAL' : 'PRODUÇÃO'}`);
console.log(`[API Config] Usando API base: ${window.API_BASE_URL}`);

// Função para construir URLs da API
window.getApiUrl = function(endpoint) {
  // Remover barra inicial se presente
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.substring(1);
  }
  return `${window.API_BASE_URL}/${endpoint}`;
};

// Interceptar todas as chamadas de fetch para gerenciar APIs
(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Se for uma chamada para API
    if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
      // Normalizar a URL
      const apiPath = url.split('/api/')[1];
      const newUrl = `${window.API_BASE_URL}/${apiPath}`;
      
      // Log para depuração
      console.log(`[API Request] ${url} -> ${newUrl}`);
      
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
          console.log(`[API Response] ${newUrl} - Status: ${response.status}`);
          return response;
        })
        .catch(error => {
          console.error(`[API Error] Falha ao conectar com ${newUrl}:`, error.message);
          
          // Em caso de erro, tentar um fallback
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
              message: 'Autenticação local (modo offline)',
              fallback: true
            }), { 
              status: 200, 
              headers: { 'Content-Type': 'application/json' }
            }));
          }
          
          // Se o servidor local estiver indisponível em desenvolvimento, tentar API remota
          if (isLocalDev && error.message.includes('Failed to fetch')) {
            console.log('[API Fallback] Servidor local indisponível, tentando API remota');
            const remoteUrl = `https://virtualradio.h4xd66.easypanel.host/api/${apiPath}`;
            
            return originalFetch(remoteUrl, options)
              .then(response => {
                console.log(`[API Remote Fallback] ${remoteUrl} - Status: ${response.status}`);
                return response;
              })
              .catch(remoteError => {
                console.error(`[API Remote Fallback Error] ${remoteUrl}:`, remoteError.message);
                return Promise.reject(error); // Retornar o erro original
              });
          }
          
          // Se não for um endpoint com fallback, retorna o erro
          return Promise.reject(error);
        });
    }
    
    // Para URLs não-API, usar fetch normal
    return originalFetch(url, options);
  };
})();

// Verificar a conexão com a API na inicialização
fetch(window.API_BASE_URL + '/test')
  .then(response => response.json())
  .then(data => {
    console.log('[API Test] Conexão com API estabelecida com sucesso:', data);
  })
  .catch(error => {
    console.error('[API Test] Falha ao conectar com a API:', error.message);
    
    if (isLocalDev) {
      console.warn('[API Warning] API local indisponível. Tentando usar a API remota como fallback.');
      
      // Tentar API remota como fallback
      fetch('https://virtualradio.h4xd66.easypanel.host/api/test')
        .then(response => response.json())
        .then(data => {
          console.log('[API Test] Conexão com API remota estabelecida com sucesso:', data);
          window.API_BASE_URL = 'https://virtualradio.h4xd66.easypanel.host/api';
          console.log('[API Config] Alterado para API remota:', window.API_BASE_URL);
        })
        .catch(remoteError => {
          console.error('[API Test] Falha ao conectar com a API remota:', remoteError.message);
          console.warn('[API Warning] Aplicativo funcionará no modo offline com dados mockados.');
        });
    }
  }); 