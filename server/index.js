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
  app.use(cors());
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
    cookie: { secure: process.env.NODE_ENV === 'production' }
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
    
    if (email === 'admin' && password === 'admin123') {
      req.session.user = {
        id: 0,
        username: 'Admin',
        email: 'admin',
        role: 'admin'
      };
      return res.json({ 
        message: 'Login bem-sucedido (modo fallback)',
        user: req.session.user,
        mode: 'fallback'
      });
    } else {
      return res.status(401).json({ 
        message: 'Credenciais inválidas',
        fallbackCredentials: 'Use admin/admin123'
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
          
          if (email === 'admin' && password === 'admin123') {
            req.session.user = {
              id: 0,
              username: 'Admin',
              email: 'admin',
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

    // Servir arquivos estáticos do Next.js em produção
    if (process.env.NODE_ENV === 'production') {
      // Caminho para os arquivos do Next.js
      const nextPath = path.join(__dirname, '../client/.next');
      const publicPath = path.join(__dirname, '../client/public');
      
      // Verificar se a pasta .next existe (build normal do Next.js)
      if (fs.existsSync(nextPath)) {
        console.log('Servindo arquivos estáticos do Next.js da pasta .next');
        
        // Servir arquivos estáticos do Next.js
        app.use('/_next', express.static(path.join(__dirname, '../client/.next')));
        
        // Também servir arquivos da pasta public
        if (fs.existsSync(publicPath)) {
          app.use(express.static(publicPath));
        }
        
        // ALTERAÇÃO: Em vez de usar SSR, servir os arquivos HTML estáticos para evitar erros de renderização
        app.get('*', (req, res, next) => {
          // Pular rotas de API
          if (req.path.startsWith('/api/')) {
            return next();
          }
          
          // Determinar qual arquivo HTML servir
          let htmlPath = path.join(__dirname, '../client/.next/server/pages');
          
          // Normalizar o caminho da requisição
          const normalizedPath = req.path === '/' ? '/index' : req.path;
          const htmlFilePath = path.join(htmlPath, `${normalizedPath}.html`);
          
          // Verificar se o arquivo HTML existe
          if (fs.existsSync(htmlFilePath)) {
            return res.sendFile(htmlFilePath);
          }
          
          // Fallback para o arquivo 404.html ou index.html
          const notFoundPath = path.join(htmlPath, '404.html');
          if (fs.existsSync(notFoundPath)) {
            return res.status(404).sendFile(notFoundPath);
          }
          
          // Se tudo mais falhar, usar index.html
          const indexPath = path.join(htmlPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
          }
          
          // Fallback final é uma mensagem de erro simples
          res.status(404).send(`
          <html>
            <head>
              <title>VirtualRadio - Página não encontrada</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; }
                h1 { color: #4a5568; }
                .box { background: #f7f7f7; padding: 20px; border-radius: 8px; border-left: 4px solid #4a5568; margin: 20px 0; }
              </style>
            </head>
            <body>
              <h1>Página não encontrada</h1>
              <div class="box">
                <p>A página solicitada não foi encontrada.</p>
                <p>A API do servidor ainda pode estar funcionando. <a href="/api/test">Testar API</a></p>
                <p>Para entrar no modo admin, use <a href="/api/auth/login-fallback">login alternativo</a> com admin/admin123</p>
              </div>
            </body>
          </html>
          `);
        });
        
        console.log('Configuração para servir arquivos estáticos concluída');
      } else {
        // Se não encontrou build do Next.js, use o fallback
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api/')) {
            // Continue para rotas de API
            return next();
          }
          
          res.status(404).send(`
          <html>
            <head>
              <title>VirtualRadio - Aplicação não encontrada</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; }
                h1 { color: #4a5568; }
                .box { background: #f7f7f7; padding: 20px; border-radius: 8px; border-left: 4px solid #4a5568; margin: 20px 0; }
              </style>
            </head>
            <body>
              <h1>Aplicação não encontrada</h1>
              <div class="box">
                <p>A aplicação não foi encontrada ou não foi compilada corretamente.</p>
                <p>A API do servidor ainda pode estar funcionando. <a href="/api/test">Testar API</a></p>
                <p>Para entrar no modo admin, use <a href="/api/auth/login-fallback">login alternativo</a> com admin/admin123</p>
              </div>
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