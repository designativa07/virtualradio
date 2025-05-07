const express = require('express');
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
    console.log('No token provided in radio route');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Token verified in radio route:', decoded);
    next();
  } catch (error) {
    console.error('Error verifying token in radio route:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware
const isAuthenticated = verifyToken;

const isAdminOrSystemAdmin = (req, res, next) => {
  // First verify the token
  verifyToken(req, res, () => {
    // Now check the user role from the decoded token
    console.log('Checking admin role. User:', req.user);
    if (req.user.role !== 'radio_admin' && req.user.role !== 'system_admin' && req.user.role !== 'admin') {
      console.log('Access denied - Invalid role:', req.user.role);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
  });
};

// Get all radios
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const [radios] = await db.query(`
      SELECT r.*, u.username as admin_username 
      FROM radios r
      JOIN users u ON r.admin_id = u.id
    `);
    
    res.json({ radios });
  } catch (error) {
    console.error('Error fetching radios:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single radio
router.get('/:id', isAuthenticated, async (req, res) => {
  const radioId = req.params.id;
  
  console.log('=== GET RADIO DETAILS ===');
  console.log('Radio ID:', radioId);
  console.log('User:', req.user);
  
  try {
    console.log('Executando query para buscar rádio...');
    const [radios] = await db.query(`
      SELECT r.*, u.username as admin_username 
      FROM radios r
      JOIN users u ON r.admin_id = u.id
      WHERE r.id = ?
    `, [radioId]);
    
    console.log('Resultado da query:', radios);
    
    if (radios.length === 0) {
      console.log('Rádio não encontrado');
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    console.log('Rádio encontrado:', radios[0]);
    res.json({ radio: radios[0] });
  } catch (error) {
    console.error('Erro ao buscar rádio:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new radio
router.post('/', isAdminOrSystemAdmin, async (req, res) => {
  const { name, description } = req.body;
  const adminId = req.user.id; // Use JWT user data
  
  console.log('Creating radio - Request body:', req.body);
  console.log('Admin ID from token:', adminId);
  
  if (!name) {
    return res.status(400).json({ message: 'Radio name is required' });
  }
  
  try {
    console.log('Attempting to insert radio with values:', { name, adminId, description: description || '' });
    const [result] = await db.query(
      'INSERT INTO radios (name, admin_id, description) VALUES (?, ?, ?)',
      [name, adminId, description || '']
    );
    
    console.log('Radio created successfully with ID:', result.insertId);
    
    res.status(201).json({
      message: 'Radio created successfully',
      radioId: result.insertId
    });
  } catch (error) {
    console.error('Error creating radio:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug route to test radio creation with fixed admin ID
router.post('/debug-create', isAuthenticated, async (req, res) => {
  const { name, description } = req.body;
  const adminId = 1; // Fixed admin ID for debugging
  
  console.log('Debug creating radio with fixed admin_id=1');
  console.log('Request body:', req.body);
  
  if (!name) {
    return res.status(400).json({ message: 'Radio name is required' });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO radios (name, admin_id, description) VALUES (?, ?, ?)',
      [name, adminId, description || '']
    );
    
    console.log('Debug radio created successfully with ID:', result.insertId);
    
    res.status(201).json({
      message: 'Radio created successfully using debug endpoint',
      radioId: result.insertId,
      debugInfo: {
        adminId: adminId,
        originalUser: req.user
      }
    });
  } catch (error) {
    console.error('Error creating debug radio:', error);
    res.status(500).json({ 
      message: 'Server error in debug endpoint',
      error: error.message,
      stack: error.stack
    });
  }
});

// Update a radio
router.put('/:id', isAdminOrSystemAdmin, async (req, res) => {
  const radioId = req.params.id;
  const { name, description } = req.body;
  const userId = req.user.id; // Use JWT user data
  
  try {
    // Check if the user is the radio admin or a system admin
    const [radios] = await db.query(
      'SELECT * FROM radios WHERE id = ?',
      [radioId]
    );
    
    if (radios.length === 0) {
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    const radio = radios[0];
    
    if (req.user.role !== 'system_admin' && req.user.role !== 'admin' && radio.admin_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await db.query(
      'UPDATE radios SET name = ?, description = ? WHERE id = ?',
      [name, description, radioId]
    );
    
    res.json({ message: 'Radio updated successfully' });
  } catch (error) {
    console.error('Error updating radio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a radio
router.delete('/:id', isAdminOrSystemAdmin, async (req, res) => {
  const radioId = req.params.id;
  const userId = req.user.id; // Use JWT user data
  
  try {
    // Check if the user is the radio admin or a system admin
    const [radios] = await db.query(
      'SELECT * FROM radios WHERE id = ?',
      [radioId]
    );
    
    if (radios.length === 0) {
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    const radio = radios[0];
    
    if (req.user.role !== 'system_admin' && req.user.role !== 'admin' && radio.admin_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await db.query('DELETE FROM radios WHERE id = ?', [radioId]);
    
    res.json({ message: 'Radio deleted successfully' });
  } catch (error) {
    console.error('Error deleting radio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 