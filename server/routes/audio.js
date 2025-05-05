const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
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
    console.log('No token provided in audio route');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verifying token in audio route:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware
const isAuthenticated = verifyToken;

const isRadioAdmin = async (req, res, next) => {
  // First verify the token
  verifyToken(req, res, async () => {
    // System admin has access to all radios
    if (req.user.role === 'system_admin' || req.user.role === 'admin') {
      return next();
    }
    
    // Get radio ID from request
    let radioId = req.params.radioId || req.body.radioId;
    
    if (!radioId) {
      return res.status(400).json({ message: 'Radio ID is required' });
    }
    
    try {
      // Check if user is the radio admin
      const [radios] = await db.query(
        'SELECT * FROM radios WHERE id = ? AND admin_id = ?',
        [radioId, req.user.id]
      );
      
      if (radios.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      next();
    } catch (error) {
      console.error('Error checking radio admin:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// Get all audio files for a radio
router.get('/radio/:radioId', isAuthenticated, async (req, res) => {
  const radioId = req.params.radioId;
  
  try {
    const [files] = await db.query(
      'SELECT * FROM audio_files WHERE radio_id = ? ORDER BY created_at DESC',
      [radioId]
    );
    
    res.json({ files });
  } catch (error) {
    console.error('Error fetching audio files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload new audio file
router.post('/upload', isAuthenticated, isRadioAdmin, async (req, res) => {
  if (!req.files || !req.files.audio) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const { audio } = req.files;
  const { title, type, radioId } = req.body;
  
  if (!title || !type || !radioId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Validate file type
  if (!audio.name.match(/\.(mp3|wav|ogg)$/)) {
    return res.status(400).json({ message: 'Unsupported file format' });
  }
  
  try {
    // Create directory for radio if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads', radioId.toString());
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save file
    const fileName = `${Date.now()}_${audio.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    
    await audio.mv(filePath);
    
    // Save to database
    const [result] = await db.query(
      'INSERT INTO audio_files (radio_id, title, type, file_path) VALUES (?, ?, ?, ?)',
      [radioId, title, type, `uploads/${radioId}/${fileName}`]
    );
    
    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: result.insertId,
      filePath: `uploads/${radioId}/${fileName}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Delete audio file
router.delete('/:id', isAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  
  try {
    // Get file details
    const [files] = await db.query('SELECT * FROM audio_files WHERE id = ?', [fileId]);
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const file = files[0];
    
    // Check permissions (only radio admin or system admin can delete)
    if (req.user.role !== 'system_admin' && req.user.role !== 'admin') {
      const [radios] = await db.query(
        'SELECT * FROM radios WHERE id = ? AND admin_id = ?',
        [file.radio_id, req.user.id]
      );
      
      if (radios.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Delete file from storage
    const filePath = path.join(__dirname, '../../', file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await db.query('DELETE FROM audio_files WHERE id = ?', [fileId]);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 