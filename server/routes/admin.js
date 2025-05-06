const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || 'virtualradioappsecretkey';

// Middleware for JWT verification
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Not authenticated',
      error: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

// Authentication middleware
const isSystemAdmin = (req, res, next) => {
  // First verify the token
  verifyToken(req, res, () => {
    // Check if user has system_admin role
    if (req.user.role !== 'system_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  });
};

// Middleware para verificar se o usuário é um admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso não autorizado' });
  }
};

// Get all users
router.get('/users', isSystemAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM users');
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new user
router.post('/users', isSystemAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  
  // Validate input
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', isSystemAdmin, async (req, res) => {
  const userId = req.params.id;
  
  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Nova rota pública para criar usuário admin se não existir
router.get('/setup-admin', async (req, res) => {
  try {
    // Verificar se já existe um admin
    const [admins] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
    
    if (admins[0].count > 0) {
      return res.json({ 
        message: 'Um administrador já existe no sistema',
        success: false 
      });
    }
    
    // Criar admin se não existir
    await db.query(
      'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, SHA2(?, 256), ?, NOW())',
      ['Admin', 'admin@virtualradio.com', 'admin123', 'admin']
    );
    
    res.json({ 
      message: 'Administrador criado com sucesso',
      email: 'admin@virtualradio.com',
      password: 'admin123',
      success: true
    });
  } catch (error) {
    console.error('Erro ao configurar admin:', error);
    res.status(500).json({ 
      message: 'Erro ao configurar admin',
      error: error.message,
      success: false
    });
  }
});

module.exports = router; 