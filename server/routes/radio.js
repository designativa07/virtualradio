const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

const isAdminOrSystemAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.session.user.role !== 'radio_admin' && req.session.user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  next();
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
  
  try {
    const [radios] = await db.query(`
      SELECT r.*, u.username as admin_username 
      FROM radios r
      JOIN users u ON r.admin_id = u.id
      WHERE r.id = ?
    `, [radioId]);
    
    if (radios.length === 0) {
      return res.status(404).json({ message: 'Radio not found' });
    }
    
    res.json({ radio: radios[0] });
  } catch (error) {
    console.error('Error fetching radio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new radio
router.post('/', isAdminOrSystemAdmin, async (req, res) => {
  const { name, description } = req.body;
  const adminId = req.session.user.id;
  
  if (!name) {
    return res.status(400).json({ message: 'Radio name is required' });
  }
  
  try {
    const [result] = await db.query(
      'INSERT INTO radios (name, admin_id, description) VALUES (?, ?, ?)',
      [name, adminId, description || '']
    );
    
    res.status(201).json({
      message: 'Radio created successfully',
      radioId: result.insertId
    });
  } catch (error) {
    console.error('Error creating radio:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a radio
router.put('/:id', isAdminOrSystemAdmin, async (req, res) => {
  const radioId = req.params.id;
  const { name, description } = req.body;
  const userId = req.session.user.id;
  
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
    
    if (req.session.user.role !== 'system_admin' && radio.admin_id !== userId) {
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
  const userId = req.session.user.id;
  
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
    
    if (req.session.user.role !== 'system_admin' && radio.admin_id !== userId) {
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