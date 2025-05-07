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

// Dados de rádios para mock
const mockRadios = [
  {
    id: 1,
    name: 'Rádio Teste 1',
    description: 'Descrição da rádio teste 1',
    logo: 'https://via.placeholder.com/150',
    status: 'active',
    created_at: '2023-05-01T10:00:00Z',
    user_id: 1
  },
  {
    id: 2,
    name: 'Rádio Teste 2',
    description: 'Descrição da rádio teste 2',
    logo: 'https://via.placeholder.com/150',
    status: 'active',
    created_at: '2023-05-02T10:00:00Z',
    user_id: 1
  },
  {
    id: 3,
    name: 'Rádio Teste 3',
    description: 'Descrição da rádio teste 3',
    logo: 'https://via.placeholder.com/150',
    status: 'active',
    created_at: '2023-05-03T10:00:00Z',
    user_id: 1
  }
];

// Mock áudios para rádios
const mockAudios = [
  {
    id: 1,
    title: 'Áudio Teste 1',
    filename: 'audio1.mp3',
    file_path: '/uploads/audio1.mp3',
    duration: 180,
    type: 'music',
    radio_id: 1,
    created_at: '2023-05-10T10:00:00Z'
  },
  {
    id: 2,
    title: 'Áudio Teste 2',
    filename: 'audio2.mp3',
    file_path: '/uploads/audio2.mp3',
    duration: 240,
    type: 'spot',
    radio_id: 1,
    created_at: '2023-05-11T10:00:00Z'
  },
  {
    id: 3,
    title: 'Áudio Teste 3',
    filename: 'audio3.mp3',
    file_path: '/uploads/audio3.mp3',
    duration: 300,
    type: 'music',
    radio_id: 2,
    created_at: '2023-05-12T10:00:00Z'
  },
  {
    id: 4,
    title: 'Áudio Teste 4',
    filename: 'audio4.mp3',
    file_path: '/uploads/audio4.mp3',
    duration: 180,
    type: 'music',
    radio_id: 3,
    created_at: '2023-05-13T10:00:00Z'
  }
];

// Endpoint para listar rádios
app.get('/api/radio', (req, res) => {
  console.log('Mock: Listando rádios');
  return res.json(mockRadios);
});

// Endpoint para obter rádio por ID
app.get('/api/radio/:id', (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`Mock: Obtendo rádio ${id}`);
  
  const radio = mockRadios.find(r => r.id === id);
  
  if (!radio) {
    return res.status(404).json({ message: 'Rádio não encontrada' });
  }
  
  return res.json(radio);
});

// Endpoint para listar áudios de uma rádio
app.get('/api/audio/radio/:id', (req, res) => {
  const radioId = parseInt(req.params.id);
  console.log(`Mock: Listando áudios da rádio ${radioId}`);
  
  const audios = mockAudios.filter(a => a.radio_id === radioId);
  
  return res.json(audios);
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