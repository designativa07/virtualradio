/**
 * API Proxy Debug Server para VirtualRadio
 * 
 * Este servidor atua como um intermediário entre o cliente e o servidor
 * da API para ajudar a diagnosticar problemas de conexão.
 * 
 * Uso: node api-proxy-debug.js
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Configuração do proxy
const LOCAL_API_URL = 'http://localhost:3000';
const REMOTE_API_URL = 'https://virtualradio.h4xd66.easypanel.host';

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Logger middleware para todas as requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(' Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(' Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capturar a resposta
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${timestamp}] Response: ${res.statusCode}`);
    console.log(' Body:', body.substring(0, 200) + (body.length > 200 ? '...' : ''));
    return originalSend.call(this, body);
  };
  
  next();
});

// Rota para testar o proxy
app.get('/', (req, res) => {
  res.send({
    message: 'VirtualRadio API Proxy Debug Server',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/api/*': 'Redireciona para a API local',
      '/remote-api/*': 'Redireciona para a API remota',
      '/toggle-target': 'Alterna entre API local e remota',
      '/status': 'Status atual do proxy'
    }
  });
});

// Estado do proxy
let useRemoteApi = false;

// Rota para alternar entre API local e remota
app.get('/toggle-target', (req, res) => {
  useRemoteApi = !useRemoteApi;
  res.send({
    message: `Agora usando a API ${useRemoteApi ? 'REMOTA' : 'LOCAL'}`,
    target: useRemoteApi ? REMOTE_API_URL : LOCAL_API_URL
  });
});

// Status atual
app.get('/status', (req, res) => {
  res.send({
    status: 'online',
    target: useRemoteApi ? 'remote' : 'local',
    targetUrl: useRemoteApi ? REMOTE_API_URL : LOCAL_API_URL,
    timestamp: new Date().toISOString()
  });
});

// Proxy para a API local
app.all('/api/*', async (req, res) => {
  try {
    const targetUrl = useRemoteApi ? REMOTE_API_URL : LOCAL_API_URL;
    const path = req.originalUrl;
    const url = `${targetUrl}${path}`;
    
    console.log(`[Proxy] Redirecionando para: ${url}`);
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };
    
    // Adicionar body para métodos POST, PUT, etc.
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }
    
    // Fazer a requisição para o servidor de destino
    try {
      const proxyRes = await fetch(url, options);
      const data = await proxyRes.text();
      
      // Copiar status e headers
      res.status(proxyRes.status);
      for (const [key, value] of proxyRes.headers.entries()) {
        res.setHeader(key, value);
      }
      
      // Enviar resposta
      res.send(data);
    } catch (error) {
      console.error(`[Proxy Error] ${error.message}`);
      
      // Se for um erro de conexão com a API local, tentar usar o mock
      if (error.code === 'ECONNREFUSED' && !useRemoteApi) {
        console.log('[Proxy] Tentando fallback para mock data');
        
        // Fallback para /auth/me
        if (path.includes('/api/auth/me')) {
          return res.json({
            authenticated: true,
            user: {
              id: 1,
              name: 'Administrador (Mock)',
              email: 'admin@virtualradio.com',
              role: 'admin'
            },
            isTest: true,
            message: 'Autenticação local mock (via proxy)'
          });
        }
        
        // Fallback genérico
        return res.json({
          message: 'API local indisponível',
          error: error.message,
          mockData: true
        });
      }
      
      res.status(502).json({
        error: 'Erro no proxy',
        message: error.message,
        target: url
      });
    }
  } catch (error) {
    console.error('[Proxy Server Error]', error);
    res.status(500).json({
      error: 'Erro interno no servidor proxy',
      message: error.message
    });
  }
});

// Proxy direto para a API remota
app.all('/remote-api/*', async (req, res) => {
  try {
    const remotePath = req.originalUrl.replace('/remote-api', '/api');
    const url = `${REMOTE_API_URL}${remotePath}`;
    
    console.log(`[Remote Proxy] Redirecionando para: ${url}`);
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }
    
    const proxyRes = await fetch(url, options);
    const data = await proxyRes.text();
    
    res.status(proxyRes.status);
    for (const [key, value] of proxyRes.headers.entries()) {
      res.setHeader(key, value);
    }
    
    res.send(data);
  } catch (error) {
    console.error('[Remote Proxy Error]', error);
    res.status(502).json({
      error: 'Erro no proxy remoto',
      message: error.message
    });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`
=======================================================
VirtualRadio API Proxy Debug Server rodando na porta ${PORT}
=======================================================

Para usar:
1. Configure o cliente para apontar para http://localhost:${PORT}/api/
2. Todas as chamadas serão logadas no console
3. Use /toggle-target para alternar entre API local e remota
4. Acesse http://localhost:${PORT}/status para ver o status atual

Proxy inicialmente apontando para: ${LOCAL_API_URL}
  `);
}); 