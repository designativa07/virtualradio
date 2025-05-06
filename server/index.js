const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Print environment variables (excluding sensitive data)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST ? '✓ Set' : '✗ Not set',
  DB_USER: process.env.DB_USER ? '✓ Set' : '✗ Not set',
  DB_NAME: process.env.DB_NAME ? '✓ Set' : '✗ Not set',
  DB_PASS: process.env.DB_PASS ? '✓ Set' : '✗ Not set (Empty DB password)',
  SESSION_SECRET: process.env.SESSION_SECRET ? '✓ Set' : '✗ Not set',
});

// Tratar sinais de encerramento do processo para shutdown gracioso
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando o servidor graciosamente...');
  // Aguardar 5 segundos antes de encerrar para permitir logs
  setTimeout(() => process.exit(0), 5000);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando o servidor graciosamente...');
  // Aguardar 5 segundos antes de encerrar para permitir logs
  setTimeout(() => process.exit(0), 5000);
});

// Capturar exceções não tratadas
process.on('uncaughtException', (error) => {
  console.error('Exceção não tratada:', error);
  // Não encerrar o processo, tentar continuar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
  // Não encerrar o processo, tentar continuar
});

// Configuração principal do servidor
async function setupServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir qualquer origem, inclusive chamadas locais
      return callback(null, true);
    },
    credentials: true  // Importante: Permite envio de cookies em requisições CORS
  }));
  app.use(express.json());
  app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'tmp'),
    createParentPath: true
  }));

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',  // Permite cookies entre domínios diferentes
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
  }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }

  // Servir uploads
  app.use('/uploads', express.static(uploadsDir));

  // Serve favicon directly to prevent 500 errors
  app.get('/favicon.ico', (req, res) => {
    // Return a simple transparent favicon to avoid errors
    const faviconPath = path.join(__dirname, 'assets', 'favicon.ico');
    
    // Check if favicon exists in assets, if not return a transparent 1x1 pixel
    if (fs.existsSync(faviconPath)) {
      res.sendFile(faviconPath);
    } else {
      // Create a 1x1 transparent pixel as base64 data URI
      const transparentPixel = Buffer.from('AAABAAEAAQEAAAEAGAAwAAAAFgAAACgAAAABAAAAAgAAAAEAGAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAA=', 'base64');
      res.setHeader('Content-Type', 'image/x-icon');
      res.send(transparentPixel);
    }
  });

  // Test route that doesn't require database
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'API working correctly',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Direct database status check route
  app.get('/db-status', async (req, res) => {
    try {
      const db = require('./config/database');
      
      // Try to get a connection
      try {
        const connection = await db.getConnection();
        connection.release();
        
        res.json({
          status: 'ok',
          message: 'Database connection successful'
        });
      } catch (dbError) {
        console.error('Database connection test failed:', dbError);
        
        // Return detailed error info
        res.status(503).json({
          status: 'error',
          message: 'Database connection failed',
          error: dbError.message,
          code: dbError.code || 'UNKNOWN',
          stack: process.env.NODE_ENV === 'development' ? dbError.stack : undefined
        });
      }
    } catch (err) {
      console.error('Error importing database module:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to initialize database module',
        error: err.message
      });
    }
  });

  // Load debug routes early to ensure they're always available
  try {
    app.use('/api/debug', require('./routes/debug'));
    console.log('Debug routes loaded successfully');
  } catch (err) {
    console.error('Error loading debug routes:', err);
  }

  // API básica de verificação de estado (healthcheck)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'online', 
      uptime: process.uptime() 
    });
  });

  // Login de admin simplificado que não depende de banco de dados
  app.post('/api/auth/login-fallback', (req, res) => {
    const { email, password } = req.body;
    
    const JWT_SECRET = process.env.SESSION_SECRET || 'jwt_secret_key';
    
    console.log('Login fallback tentado com:', { email });
    
    // Aceitar tanto 'admin' quanto 'admin@admin.com'
    if ((email === 'admin' || email === 'admin@admin.com' || email === 'admin@virtualradio.com') && password === 'admin123') {
      const user = {
        id: 0,
        username: 'Admin',
        email: email,
        role: 'admin'
      };
      
      // Gerar token JWT
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
      
      // Log de depuração
      console.log('Login fallback bem-sucedido:', { user });
      
      return res.json({ 
        message: 'Login bem-sucedido (modo fallback)',
        user: user,
        token: token,
        mode: 'fallback'
      });
    } else {
      return res.status(401).json({ 
        message: 'Credenciais inválidas',
        fallbackCredentials: 'Use admin@admin.com / admin123'
      });
    }
  });

  // Set up error handling for missing routes/DB issues
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
  });

  // Rota raiz com status do aplicativo e do banco de dados
  app.get('/', async (req, res) => {
    let dbStatus = 'Desconhecido';
    let dbError = '';
    
    try {
      const db = require('./config/database');
      
      try {
        // Tentar obter uma conexão
        const connection = await db.getConnection();
        connection.release();
        dbStatus = 'Conectado';
      } catch (dbError) {
        dbStatus = 'Falha na conexão';
        dbError = dbError.message;
      }
    } catch (err) {
      dbStatus = 'Erro ao carregar módulo de banco de dados';
      dbError = err.message;
    }
    
    // Enviar HTML simples com as informações
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>VirtualRadio - Status do Servidor</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          h1 { color: #333; }
          .status { margin: 20px 0; padding: 15px; border-radius: 5px; }
          .success { background-color: #d4edda; color: #155724; }
          .warning { background-color: #fff3cd; color: #856404; }
          .error { background-color: #f8d7da; color: #721c24; }
          .box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          pre { background: #f8f9fa; padding: 10px; overflow: auto; }
          a { display: inline-block; margin-top: 20px; padding: 10px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          a:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h1>VirtualRadio - Status do Servidor</h1>
        
        <div class="box">
          <h2>Informações do Servidor</h2>
          <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p><strong>Tempo de atividade:</strong> ${Math.floor(process.uptime())} segundos</p>
          <p><strong>Porta:</strong> ${process.env.PORT || 3000}</p>
        </div>
        
        <div class="box">
          <h2>Status do Banco de Dados</h2>
          <div class="status ${dbStatus === 'Conectado' ? 'success' : 'error'}">
            <p><strong>Status:</strong> ${dbStatus}</p>
            ${dbError ? `<p><strong>Erro:</strong> ${dbError}</p>` : ''}
          </div>
          
          <h3>Configuração do Banco de Dados</h3>
          <pre>
HOST: ${process.env.DB_HOST || 'não definido'}
USER: ${process.env.DB_USER || 'não definido'}
DATABASE: ${process.env.DB_NAME || 'não definido'}
          </pre>
        </div>
        
        <div class="box">
          <h2>Links Úteis</h2>
          <ul>
            <li><a href="/db-status">Verificar Status do BD (JSON)</a></li>
            <li><a href="/api/debug/mock-radios">Listar Rádios (Mock)</a></li>
            <li><a href="/api/test">Testar API</a></li>
            <li><a href="/health">Verificar Saúde do Servidor</a></li>
          </ul>
        </div>
        
        <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}" target="_blank">Abrir Aplicação Cliente</a>
      </body>
      </html>
    `);
  });

  // API routes
  try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/radio', require('./routes/radio'));
    app.use('/api/audio', require('./routes/audio'));
    app.use('/api/admin', require('./routes/admin'));
    console.log('API routes loaded successfully');
  } catch (err) {
    console.error('Error loading API routes:', err);
  }

  // Servir o Next.js em modo SSR em produção
  if (process.env.NODE_ENV === 'production') {
    try {
      const next = require('next');
      const dev = false;
      const clientDir = path.join(__dirname, '../client');
      
      // Verificar se o diretório .next/server existe e criá-lo caso não exista
      const serverDir = path.join(clientDir, '.next/server');
      if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
        console.log('Created .next/server directory');
      }
      
      // Verificar se o arquivo font-manifest.json existe e criá-lo caso não exista
      const fontManifestPath = path.join(serverDir, 'font-manifest.json');
      if (!fs.existsSync(fontManifestPath)) {
        fs.writeFileSync(fontManifestPath, '[]', 'utf8');
        console.log('Created empty font-manifest.json file');
      }
      
      const nextApp = next({ dev, dir: clientDir });
      const handle = nextApp.getRequestHandler();
      console.log('Inicializando Next.js para SSR...');
      await nextApp.prepare();
      app.all('*', (req, res) => {
        return handle(req, res);
      });
      console.log('Next.js integrado com sucesso (SSR)');
    } catch (err) {
      console.error('Erro ao inicializar Next.js:', err);
      // Disponibilizar uma página simples para não quebrar totalmente o aplicativo
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
          return next();
        }
        res.send(`
          <html>
            <head><title>VirtualRadio - Modo de contingência</title></head>
            <body>
              <h1>VirtualRadio - Modo de contingência</h1>
              <p>O frontend está temporariamente indisponível. Por favor, tente novamente mais tarde.</p>
              <p>API endpoints continuam disponíveis em /api/*</p>
            </body>
          </html>
        `);
      });
    }
  } else {
    // Em desenvolvimento, apenas redirecionar para a API (o frontend será executado separadamente)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.status(404).send('Aplicação frontend não disponível em modo de desenvolvimento. Use npm run dev:client para iniciar o frontend.');
    });
  }

  // Start server
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`VirtualRadio server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EACCES') {
      console.error(`Port ${PORT} requires elevated privileges`);
    } else if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
  });

  // Configurar keepalive para evitar problemas de conexão pendente
  server.keepAliveTimeout = 65000; // 65 segundos
  server.headersTimeout = 66000; // 66 segundos (deve ser maior que keepAliveTimeout)

  return server;
}

// Iniciar o servidor
setupServer().catch(err => {
  console.error('Erro fatal ao iniciar o servidor:', err);
  // Don't exit process immediately to allow logs to be written
  setTimeout(() => process.exit(1), 3000);
}); 