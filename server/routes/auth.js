const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/database');

// Chave secreta para JWT - garantir que seja consistente
const JWT_SECRET = process.env.SESSION_SECRET || 'virtualradioappsecretkey';

// Middleware para verificar token JWT com logs detalhados
const verifyToken = (req, res, next) => {
  // Obter o token do cabeçalho Authorization ou dos cookies
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('=== VERIFICAÇÃO DE TOKEN ===');
  console.log('Token recebido:', token ? 'Sim' : 'Não');
  console.log('Headers de autorização:', req.headers['authorization']);
  console.log('SESSION_SECRET definido:', process.env.SESSION_SECRET ? 'Sim' : 'Não');
  console.log('JWT_SECRET usado:', JWT_SECRET);
  
  if (!token) {
    console.log('Nenhum token fornecido');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Token verificado com sucesso:', decoded);
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    console.error('Detalhes do erro:', error);
    
    // Tentar decodificar sem verificar para debug
    try {
      const decodedWithoutVerify = jwt.decode(token);
      console.log('Token decodificado (sem verificação):', decodedWithoutVerify);
    } catch (e) {
      console.error('Erro ao decodificar token:', e.message);
    }
    
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Test database connection before proceeding with any auth request
router.use(async (req, res, next) => {
  // Pular verificação de banco de dados para rota /me
  if (req.path === '/me') {
    return next();
  }
  
  try {
    // Try to get a connection to verify database is working
    const connection = await db.getConnection();
    connection.release();
    next();
  } catch (error) {
    console.error('Database connection error in auth middleware:', error.message);
    // Special case for login - we should respond even if DB is down
    if (req.path === '/login' && req.method === 'POST') {
      // Admin fallback for development/testing when database is unavailable
      const { email, password } = req.body;
      if (email === 'admin' && password === 'admin123') {
        console.log('Using fallback admin login due to database error');
        
        const user = {
          id: 1,
          username: 'Admin',
          email: 'admin',
          role: 'admin'
        };
        
        // Gerar token JWT
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
        
        return res.json({ 
          message: 'Login successful (fallback mode)',
          user: user,
          token: token,
          mode: 'fallback'
        });
      }
    }
    return res.status(503).json({ 
      message: 'Database service unavailable', 
      error: 'Please try again later or contact support'
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('SESSION_SECRET definido:', process.env.SESSION_SECRET ? 'Sim' : 'Não');
    console.log('JWT_SECRET usado:', JWT_SECRET);
    
    // Special handling for admin/admin123 in all environments for testing
    if ((email === 'admin' || email === 'admin@admin.com' || email === 'admin@virtualradio.com') && password === 'admin123') {
      const user = {
        id: 1,
        username: 'Admin',
        email: email,
        role: 'admin'
      };
      
      // Gerar token JWT
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
      console.log('Token gerado com sucesso para admin');
      
      return res.json({ 
        message: 'Login successful (admin mode)',
        user: user,
        token: token
      });
    }
    
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Criar objeto de usuário para o token
    const userForToken = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    // Gerar token JWT
    const token = jwt.sign(userForToken, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful',
      user: userForToken,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Authentication service error', error: error.message });
  }
});

// Logout route (com JWT não precisamos fazer nada no servidor, apenas no cliente)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', verifyToken, (req, res) => {
  console.log('Rota /me chamada');
  // O middleware verifyToken já verificou o token e adicionou o user ao req
  res.json({ user: req.user });
});

// Debug route - Add this new route to debug token issues
router.get('/debug-token', verifyToken, (req, res) => {
  console.log('Debug token route called');
  console.log('User from token:', req.user);
  
  res.json({ 
    message: 'Token debug information',
    user: req.user,
    tokenWorks: true,
    timeChecked: new Date().toISOString(),
    jwtSecret: JWT_SECRET.substring(0, 3) + '***' // Show just first 3 chars for security
  });
});

// Nova rota para verificar token via POST
router.post('/verify-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token not provided' });
  }
  
  try {
    console.log('=== VERIFICAÇÃO MANUAL DE TOKEN ===');
    console.log('Token fornecido:', token ? 'Sim' : 'Não');
    console.log('SESSION_SECRET definido:', process.env.SESSION_SECRET ? 'Sim' : 'Não');
    console.log('JWT_SECRET usado:', JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    return res.json({
      message: 'Token verified successfully',
      valid: true,
      decoded: decoded,
      jwtSecret: JWT_SECRET.substring(0, 3) + '***'
    });
  } catch (error) {
    console.error('Erro ao verificar token manualmente:', error.message);
    
    // Tentar decodificar sem verificar para debug
    try {
      const decodedWithoutVerify = jwt.decode(token);
      console.log('Token decodificado (sem verificação):', decodedWithoutVerify);
      
      return res.status(401).json({
        message: 'Invalid token', 
        valid: false,
        decodedPayload: decodedWithoutVerify,
        error: error.message,
        jwtSecret: JWT_SECRET.substring(0, 3) + '***'
      });
    } catch (e) {
      return res.status(401).json({
        message: 'Invalid token format', 
        valid: false,
        error: e.message,
        jwtSecret: JWT_SECRET.substring(0, 3) + '***'
      });
    }
  }
});

// Rota para verificar configuração do ambiente
router.get('/config-check', (req, res) => {
  res.json({
    sessionSecretDefined: process.env.SESSION_SECRET ? true : false,
    jwtSecretFirstChars: JWT_SECRET.substring(0, 3) + '***',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 