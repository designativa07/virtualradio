const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || 'jwt_secret_key';

// Middleware for JWT verification
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    console.log('No token provided in admin route');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token in admin route:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
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

module.exports = router; 