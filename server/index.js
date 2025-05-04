const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');

// Load environment variables
dotenv.config();

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

  // Servir uploads
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // API Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/radio', require('./routes/radio'));
  app.use('/api/audio', require('./routes/audio'));

  // Test route
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API working correctly' });
  });

  // Servir os arquivos estáticos do Next.js em produção
  if (process.env.NODE_ENV === 'production') {
    const nextPath = path.join(__dirname, '../client/.next');
    
    // Verifique se a pasta .next existe (build normal do Next.js)
    if (fs.existsSync(nextPath)) {
      console.log('Servindo arquivos estáticos do Next.js da pasta .next');
      
      // Servir arquivos estáticos do Next.js
      app.use('/_next', express.static(path.join(__dirname, '../client/.next')));
      
      // Também servir arquivos da pasta public
      app.use(express.static(path.join(__dirname, '../client/public')));
      
      try {
        // Carregar o Next.js para lidar com as rotas não capturadas pelas APIs
        const next = require('next');
        const dev = process.env.NODE_ENV !== 'production';
        const nextApp = next({ dev, dir: path.join(__dirname, '../client') });
        const handle = nextApp.getRequestHandler();
        
        // Preparar o Next.js
        console.log('Inicializando Next.js para SSR...');
        await nextApp.prepare();
        
        // Deixar o Next.js lidar com todas as outras rotas
        app.get('*', (req, res) => {
          return handle(req, res);
        });
        
        console.log('Next.js integrado com sucesso');
      } catch (err) {
        console.error('Erro ao carregar o Next.js:', err);
        
        // Fallback simples se Next.js não puder ser carregado
        app.get('*', (req, res) => {
          res.status(500).send(`
          <html>
            <head>
              <title>VirtualRadio - Erro de Servidor</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; }
                h1 { color: #e53e3e; }
                .box { background: #f7f7f7; padding: 20px; border-radius: 8px; border-left: 4px solid #e53e3e; margin: 20px 0; }
              </style>
            </head>
            <body>
              <h1>Erro no Servidor</h1>
              <div class="box">
                <p>Ocorreu um erro ao renderizar a aplicação. Tente novamente mais tarde ou contate o administrador.</p>
                <p>A API do servidor ainda pode estar funcionando. <a href="/api/test">Testar API</a></p>
              </div>
            </body>
          </html>
          `);
        });
      }
    } else {
      // Se não encontrou build do Next.js, use o fallback
      app.get('*', (req, res) => {
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
            </div>
          </body>
        </html>
        `);
      });
    }
  } else {
    // Em desenvolvimento, apenas redirecionar para a API (o frontend será executado separadamente)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.status(404).send('Aplicação frontend não disponível em modo de desenvolvimento. Use npm run dev:client para iniciar o frontend.');
      }
    });
  }

  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`VirtualRadio server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Iniciar o servidor
setupServer().catch(err => {
  console.error('Erro fatal ao iniciar o servidor:', err);
  process.exit(1);
}); 