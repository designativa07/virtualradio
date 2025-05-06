/**
 * Servidor de teste simples para VirtualRadio
 * Serve os arquivos estáticos e redireciona as requisições de API
 */

const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

// Configuração da API remota
const API_BASE_URL = 'https://virtualradio.h4xd66.easypanel.host/api';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Endpoint de teste /api/auth/me
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Não autenticado',
      authenticated: false,
      isTest: true
    });
  }
  
  // Para fins de teste, retornar usuário fictício
  return res.json({
    authenticated: true,
    user: {
      id: 1,
      name: 'Administrador',
      email: 'admin@virtualradio.com',
      role: 'admin'
    },
    isTest: true,
    message: 'Autenticação local (modo teste)'
  });
});

// Endpoint de teste /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Tentativa de login com: ${email}`);
  
  // Aceitar qualquer login para testes
  return res.json({
    message: 'Login bem-sucedido (modo teste)',
    user: {
      id: 1,
      name: 'Administrador',
      email: email || 'admin@virtualradio.com',
      role: 'admin'
    },
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFkbWluaXN0cmFkb3IiLCJlbWFpbCI6ImFkbWluQHZpcnR1YWxyYWRpby5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MTk3MjIzMzd9.PdAmI3xfz8UsRVQj1mPAoBGfrHJ9qFS9gWmnn45M93o',
    mode: 'teste'
  });
});

// Todas as outras requisições para /api são redirecionadas para a API remota
app.all('/api/*', async (req, res) => {
  try {
    const apiPath = req.originalUrl.replace('/api/', '');
    const apiUrl = `${API_BASE_URL}/${apiPath}`;
    
    console.log(`Redirecionando para API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      ...(req.method !== 'GET' && req.body && { body: JSON.stringify(req.body) })
    });
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao redirecionar para API:', error);
    
    return res.status(502).json({
      error: 'BAD_GATEWAY',
      message: 'Não foi possível conectar ao servidor de API',
      details: error.message
    });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
  console.log(`API remota: ${API_BASE_URL}`);
}); 