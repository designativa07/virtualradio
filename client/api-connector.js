/**
 * VirtualRadio - API Connector
 * 
 * Este arquivo fornece uma camada de conexão inteligente para a API,
 * com recursos de detecção automática, fallback e diagnóstico.
 * 
 * Inclua este arquivo após api-config.js ou api-config.local.js
 */

(function() {
  // URL da API definida em api-config.js ou api-config.local.js
  const apiBaseUrl = window.API_BASE_URL || '';
  
  if (!apiBaseUrl) {
    console.error('[API Connector] Erro: API_BASE_URL não está definida. Verifique se api-config.js está carregado.');
    return;
  }

  // Configurações
  const config = {
    debug: true,                          // Exibir mensagens de debug no console
    autoRetry: true,                      // Tentar novamente automaticamente em caso de falha
    fallbackToRemote: true,               // Usar API remota como fallback para a local
    remoteApiUrl: 'https://virtualradio.h4xd66.easypanel.host/api',  // URL da API remota
    connectionCheckEndpoint: '/test',     // Endpoint para verificar conexão
    retryAttempts: 3,                     // Número de tentativas de conexão
    retryDelay: 2000,                     // Tempo entre tentativas (ms)
    connectionTimeout: 5000,              // Timeout para tentativas de conexão (ms)
  };
  
  // Estado interno
  const state = {
    isConnected: false,                  // Se temos conexão com a API
    activeApi: apiBaseUrl,               // API atualmente em uso
    connectionAttempts: 0,               // Número de tentativas de conexão já feitas
    usingFallback: false,                // Se estamos usando fallback
    lastError: null,                     // Último erro de conexão
    authToken: null,                     // Token de autenticação atual
  };
  
  // Helpers de log condicionais
  const log = {
    debug: (...args) => config.debug && console.log('[API Connector]', ...args),
    info: (...args) => console.info('[API Connector]', ...args),
    warn: (...args) => console.warn('[API Connector]', ...args),
    error: (...args) => console.error('[API Connector]', ...args),
  };
  
  // Verificar conexão com uma URL de API
  async function checkConnection(url, timeout = config.connectionTimeout) {
    log.debug(`Verificando conexão com ${url}${config.connectionCheckEndpoint}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${url}${config.connectionCheckEndpoint}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        try {
          const data = await response.json();
          log.debug(`Conexão bem-sucedida com ${url}`, data);
          return { success: true, data };
        } catch (e) {
          log.warn(`Resposta não é JSON válido:`, e);
          return { success: true, data: null };
        }
      } else {
        log.warn(`Falha ao verificar conexão: ${response.status} ${response.statusText}`);
        return { success: false, status: response.status, statusText: response.statusText };
      }
    } catch (error) {
      log.warn(`Erro ao verificar conexão:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Mudar para usar uma URL de API diferente
  function switchApiUrl(newUrl) {
    if (state.activeApi === newUrl) return;
    
    log.info(`Alterando URL da API: ${state.activeApi} -> ${newUrl}`);
    state.activeApi = newUrl;
    window.API_BASE_URL = newUrl;
    
    // Atualizar função getApiUrl
    window.getApiUrl = function(endpoint) {
      if (endpoint.startsWith('/')) {
        endpoint = endpoint.substring(1);
      }
      return `${window.API_BASE_URL}/${endpoint}`;
    };
    
    // Emitir evento para notificar mudança
    window.dispatchEvent(new CustomEvent('api-url-changed', { 
      detail: { url: newUrl, previous: state.activeApi } 
    }));
  }
  
  // Tentar conectar à API automaticamente
  async function connectToApi() {
    state.connectionAttempts++;
    log.debug(`Tentativa de conexão ${state.connectionAttempts}/${config.retryAttempts}`);

    // Tentar API atual
    const result = await checkConnection(state.activeApi);
    
    if (result.success) {
      state.isConnected = true;
      state.lastError = null;
      log.info(`Conectado com sucesso à API: ${state.activeApi}`);
      
      // Emitir evento
      window.dispatchEvent(new CustomEvent('api-connected', { 
        detail: { url: state.activeApi } 
      }));
      
      return true;
    }
    
    // Se falhar e estamos em desenvolvimento local, tentar API remota como fallback
    if (!result.success && 
        config.fallbackToRemote && 
        !state.usingFallback && 
        state.activeApi.includes('localhost')) {
      
      log.warn(`Falha ao conectar com API local. Tentando API remota como fallback.`);
      const remoteResult = await checkConnection(config.remoteApiUrl);
      
      if (remoteResult.success) {
        state.usingFallback = true;
        switchApiUrl(config.remoteApiUrl);
        state.isConnected = true;
        
        log.info(`Conectado com sucesso à API remota como fallback`);
        
        // Emitir evento
        window.dispatchEvent(new CustomEvent('api-fallback-connected', { 
          detail: { url: state.activeApi, originalUrl: apiBaseUrl } 
        }));
        
        return true;
      }
    }
    
    // Se ainda estamos tentando
    if (state.connectionAttempts < config.retryAttempts && config.autoRetry) {
      log.debug(`Tentando novamente em ${config.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      return connectToApi();
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    state.isConnected = false;
    state.lastError = result.error || 'Falha ao conectar com a API';
    
    log.error(`Não foi possível conectar à API após ${config.retryAttempts} tentativas.`);
    log.error(`Último erro: ${state.lastError}`);
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('api-connection-failed', { 
      detail: { error: state.lastError, attempts: state.connectionAttempts } 
    }));
    
    return false;
  }
  
  // Inicializar API Connector
  async function init() {
    log.info(`Inicializando API Connector com: ${state.activeApi}`);
    
    // Verificar se já temos token de autenticação
    state.authToken = localStorage.getItem('authToken');
    if (state.authToken) {
      log.debug('Token de autenticação encontrado no localStorage');
    }
    
    // Tentar conectar
    await connectToApi();
    
    // Melhorar o método fetch para automaticamente usar a URL atual da API
    enhanceFetchMethod();
    
    // Exibir mensagem de status
    if (state.isConnected) {
      if (state.usingFallback) {
        log.info(`API Connector inicializado usando API remota (fallback) - ${state.activeApi}`);
      } else {
        log.info(`API Connector inicializado com sucesso - ${state.activeApi}`);
      }
      
      // Injetar UI de diagnóstico se necessário
      if (config.debug) {
        injectDiagnosticUI();
      }
    } else {
      log.error(`API Connector inicializado em modo offline (sem conexão com API)`);
      injectOfflineIndicator();
    }
  }
  
  // Melhorar o método fetch para usar a URL correta da API
  function enhanceFetchMethod() {
    // Preservar o fetch original e o interceptor existente
    const originalFetch = window.fetch;
    
    // Melhorar o método fetch
    window.fetch = function(url, options = {}) {
      // Se for uma chamada para API
      if (typeof url === 'string' && (url.includes('/api/') || url.startsWith('/api/'))) {
        // Adicionar headers de diagnóstico
        options.headers = options.headers || {};
        options.headers['X-VirtualRadio-Client'] = 'APIConnector/1.0';
        
        // Adicionar token de autenticação se disponível e não fornecido
        if (state.authToken && !options.headers['Authorization']) {
          options.headers['Authorization'] = `Bearer ${state.authToken}`;
        }
        
        // Deixamos o interceptor existente lidar com o resto
      }
      
      // Chamar o fetch original
      return originalFetch(url, options);
    };
  }
  
  // Injetar UI de diagnóstico para desenvolvedores
  function injectDiagnosticUI() {
    if (!config.debug) return;
    
    // Criar elemento flutuante de status
    const statusEl = document.createElement('div');
    statusEl.style.position = 'fixed';
    statusEl.style.bottom = '10px';
    statusEl.style.right = '10px';
    statusEl.style.background = state.usingFallback ? '#ff9800' : '#4caf50';
    statusEl.style.color = 'white';
    statusEl.style.padding = '5px 10px';
    statusEl.style.borderRadius = '4px';
    statusEl.style.fontSize = '12px';
    statusEl.style.fontFamily = 'monospace';
    statusEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    statusEl.style.zIndex = '9999';
    statusEl.style.userSelect = 'none';
    statusEl.style.cursor = 'pointer';
    
    statusEl.textContent = state.usingFallback 
      ? `🌐 API Remota (fallback)` 
      : `🔌 API Local`;
    
    // Ao clicar, mostrar mais detalhes
    statusEl.addEventListener('click', () => {
      alert(`
Status da API:
- URL: ${state.activeApi}
- Conectado: ${state.isConnected ? 'Sim' : 'Não'}
- Modo: ${state.usingFallback ? 'Remoto (fallback)' : 'Local'}
- Autenticado: ${state.authToken ? 'Sim' : 'Não'}
      `);
    });
    
    // Adicionar à página quando o DOM estiver pronto
    if (document.body) {
      document.body.appendChild(statusEl);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(statusEl);
      });
    }
  }
  
  // Mostrar indicador de modo offline
  function injectOfflineIndicator() {
    // Criar barra de status de offline
    const offlineBar = document.createElement('div');
    offlineBar.style.position = 'fixed';
    offlineBar.style.top = '0';
    offlineBar.style.left = '0';
    offlineBar.style.right = '0';
    offlineBar.style.background = '#f44336';
    offlineBar.style.color = 'white';
    offlineBar.style.padding = '5px 10px';
    offlineBar.style.textAlign = 'center';
    offlineBar.style.fontSize = '14px';
    offlineBar.style.fontWeight = 'bold';
    offlineBar.style.zIndex = '9999';
    
    offlineBar.textContent = '⚠️ Modo Offline - API indisponível. Alguns recursos podem não funcionar.';
    
    // Adicionar botão para reconectar
    const reconnectBtn = document.createElement('button');
    reconnectBtn.textContent = 'Tentar Reconectar';
    reconnectBtn.style.marginLeft = '10px';
    reconnectBtn.style.padding = '3px 8px';
    reconnectBtn.style.background = 'white';
    reconnectBtn.style.color = '#f44336';
    reconnectBtn.style.border = 'none';
    reconnectBtn.style.borderRadius = '3px';
    reconnectBtn.style.cursor = 'pointer';
    
    reconnectBtn.addEventListener('click', async () => {
      reconnectBtn.textContent = 'Conectando...';
      reconnectBtn.disabled = true;
      
      state.connectionAttempts = 0;
      const success = await connectToApi();
      
      if (success) {
        offlineBar.style.background = '#4caf50';
        offlineBar.textContent = '✓ Conectado à API com sucesso!';
        
        setTimeout(() => {
          offlineBar.remove();
          injectDiagnosticUI();
        }, 2000);
      } else {
        reconnectBtn.textContent = 'Tentar Novamente';
        reconnectBtn.disabled = false;
      }
    });
    
    offlineBar.appendChild(reconnectBtn);
    
    // Adicionar à página quando o DOM estiver pronto
    if (document.body) {
      document.body.appendChild(offlineBar);
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(offlineBar);
      });
    }
  }
  
  // Adicionar métodos e propriedades públicas
  window.ApiConnector = {
    // Verificar status da conexão
    isConnected: () => state.isConnected,
    
    // Obter URL da API ativa
    getActiveApiUrl: () => state.activeApi,
    
    // Forçar troca para API local ou remota
    useLocalApi: () => {
      if (state.activeApi.includes('localhost')) return;
      switchApiUrl(apiBaseUrl);
      connectToApi();
    },
    
    useRemoteApi: () => {
      if (state.activeApi === config.remoteApiUrl) return;
      switchApiUrl(config.remoteApiUrl);
      connectToApi();
    },
    
    // Tentar conectar novamente à API
    reconnect: async () => {
      state.connectionAttempts = 0;
      return connectToApi();
    },
    
    // Definir token de autenticação
    setAuthToken: (token) => {
      state.authToken = token;
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    },
    
    // Habilitar ou desabilitar modo debug
    setDebug: (enabled) => {
      config.debug = !!enabled;
    }
  };
  
  // Inicializar ao carregar a página
  init();
})(); 