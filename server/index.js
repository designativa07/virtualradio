require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Importar modelos e sincronizar com o banco de dados
const { syncModels } = require('./models');

// Importar rotas
const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');

// Criar aplicação Express
const app = express();

// Configurar middlewares de segurança e otimização
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "cdn-icons-png.flaticon.com"],
      connectSrc: ["'self'", process.env.API_URL || "https://myradio.h4xd66.easypanel.host"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar CORS
app.use(cors({
  origin: [
    process.env.API_URL || 'https://myradio.h4xd66.easypanel.host',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Adicionar middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configurar pasta estática para arquivos de upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configurar pasta estática para arquivos estáticos
app.use('/client', express.static(path.join(__dirname, '../client')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Configurar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);

// Rota principal - Servir a página HTML principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Rota para o cliente
app.get('/client', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Rota para o admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin', 'index.html'));
});

// Rota de teste da API
app.get('/api', (req, res) => {
  res.json({ message: 'MyRadio API está funcionando!' });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Definir porta
const PORT = process.env.PORT || 5000;

// Sincronizar modelos e iniciar servidor
(async () => {
  try {
    // Sincronizar modelos com o banco de dados
    await syncModels();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'production'}`);
      console.log(`API URL: ${process.env.API_URL || 'https://myradio.h4xd66.easypanel.host/api'}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
  }
})(); 