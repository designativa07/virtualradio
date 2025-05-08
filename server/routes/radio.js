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
    // Primeiro, verificar se o rádio existe
    console.log('Verificando se o rádio existe...');
    const [radioCheck] = await db.query('SELECT * FROM radios WHERE id = ?', [radioId]);
    
    if (radioCheck.length === 0) {
      console.log('Rádio não encontrado');
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    console.log('Rádio encontrado:', radioCheck[0]);
    
    // Depois, fazer o JOIN com a tabela users
    console.log('Executando JOIN com a tabela users...');
    const [radios] = await db.query(`
      SELECT r.*, u.username as admin_username 
      FROM radios r
      LEFT JOIN users u ON r.admin_id = u.id
      WHERE r.id = ?
    `, [radioId]);
    
    console.log('Resultado do JOIN:', radios);
    
    if (radios.length === 0) {
      console.log('Erro: Rádio não encontrado após JOIN');
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    const radio = radios[0];
    
    // Se o admin_username for null, usar um valor padrão
    if (!radio.admin_username) {
      console.log('Admin username não encontrado, usando valor padrão');
      radio.admin_username = 'Unknown Admin';
    }
    
    // Buscar os arquivos de áudio
    console.log('Buscando arquivos de áudio...');
    const [audioFiles] = await db.query(`
      SELECT af.*, u.username as uploaded_by_username
      FROM audio_files af
      LEFT JOIN users u ON af.uploaded_by = u.id
      WHERE af.radio_id = ?
      ORDER BY af.created_at DESC
    `, [radioId]);
    
    console.log('Arquivos de áudio encontrados:', audioFiles.length);
    
    // Adicionar os arquivos de áudio ao objeto do rádio
    radio.audioFiles = audioFiles.map(file => ({
      ...file,
      uploaded_by_username: file.uploaded_by_username || 'Unknown User'
    }));
    
    console.log('Rádio final:', radio);
    res.json({ radio });
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
  
  console.log('Updating radio:', radioId);
  console.log('Request body:', req.body);
  console.log('User ID:', userId);
  
  try {
    // Check if the user is the radio admin or a system admin
    const [radios] = await db.query(
      'SELECT * FROM radios WHERE id = ?',
      [radioId]
    );
    
    if (radios.length === 0) {
      console.log('Radio not found:', radioId);
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    const radio = radios[0];
    
    if (req.user.role !== 'system_admin' && req.user.role !== 'admin' && radio.admin_id !== userId) {
      console.log('Access denied. User role:', req.user.role, 'Radio admin ID:', radio.admin_id);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update the radio
    await db.query(
      'UPDATE radios SET name = ?, description = ? WHERE id = ?',
      [name, description, radioId]
    );
    
    // Fetch the updated radio
    const [updatedRadios] = await db.query(`
      SELECT r.*, u.username as admin_username 
      FROM radios r
      LEFT JOIN users u ON r.admin_id = u.id
      WHERE r.id = ?
    `, [radioId]);
    
    if (updatedRadios.length === 0) {
      console.log('Error: Updated radio not found');
      return res.status(500).json({ message: 'Radio updated but could not retrieve updated data' });
    }
    
    console.log('Radio updated successfully:', updatedRadios[0]);
    
    res.json({ 
      message: 'Radio updated successfully',
      success: true,
      radio: updatedRadios[0]
    });
  } catch (error) {
    console.error('Error updating radio:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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