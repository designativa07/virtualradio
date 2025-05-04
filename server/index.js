const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');

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
    origin: ['http://localhost:3000', 'https://site-designativa-virutalradio.h4xd66.easypanel.host'],
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

  // Test route that doesn't require database
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'API working correctly',
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

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
    
    console.log('Login fallback tentado com:', { email });
    
    // Aceitar tanto 'admin' quanto 'admin@admin.com'
    if ((email === 'admin' || email === 'admin@admin.com' || email === 'admin@virtualradio.com') && password === 'admin123') {
      const user = {
        id: 0,
        username: 'Admin',
        email: email,
        role: 'admin'
      };
      
      req.session.user = user;
      
      // Log de depuração
      console.log('Login fallback bem-sucedido:', { user });
      console.log('Sessão:', req.session);
      
      return res.json({ 
        message: 'Login bem-sucedido (modo fallback)',
        user: user,
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

  try {
    // Try to load API routes
    // Wrap in try/catch to prevent crashing if database connection fails
    try {
      app.use('/api/auth', require('./routes/auth'));
      app.use('/api/admin', require('./routes/admin'));
      app.use('/api/radio', require('./routes/radio'));
      app.use('/api/audio', require('./routes/audio'));
      console.log('API routes loaded successfully');
    } catch (err) {
      console.error('Error loading API routes:', err);
      app.use('/api/auth', (req, res, next) => {
        if (req.path === '/login' && req.method === 'POST') {
          const { email, password } = req.body;
          
          // Aceitar tanto 'admin' quanto 'admin@admin.com'
          if ((email === 'admin' || email === 'admin@admin.com') && password === 'admin123') {
            req.session.user = {
              id: 0,
              username: 'Admin',
              email: email,
              role: 'admin'
            };
            return res.json({ 
              message: 'Login bem-sucedido (modo admin)',
              user: req.session.user
            });
          }
          return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        res.status(503).json({ error: 'Serviço de autenticação indisponível' });
      });
      app.use('/api/admin', (req, res) => res.status(503).json({ error: 'Serviço de administração indisponível' }));
      app.use('/api/radio', (req, res) => res.status(503).json({ error: 'Serviço de rádio indisponível' }));
      app.use('/api/audio', (req, res) => res.status(503).json({ error: 'Serviço de áudio indisponível' }));
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
  } catch (err) {
    console.error('Critical error during server setup:', err);
    throw err;
  }
}

// Iniciar o servidor
setupServer().catch(err => {
  console.error('Erro fatal ao iniciar o servidor:', err);
  // Don't exit process immediately to allow logs to be written
  setTimeout(() => process.exit(1), 3000);
}); 