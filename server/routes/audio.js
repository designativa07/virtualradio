const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
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
    console.log('isRadioAdmin: Checking permissions for user:', req.user.id, req.user.username, req.user.role);
    
    // System admin has access to all radios
    if (req.user.role === 'system_admin' || req.user.role === 'admin') {
      console.log('isRadioAdmin: User is admin, granting access');
      return next();
    }
    
    // Get radio ID from request - support both radioId and radio_id for compatibility
    let radioId = req.params.radioId || req.body.radioId || req.body.radio_id;
    
    console.log('isRadioAdmin: Radio ID from request:', radioId);
    console.log('isRadioAdmin: Request body keys:', Object.keys(req.body));
    
    if (!radioId) {
      console.log('isRadioAdmin: No Radio ID found in request');
      return res.status(400).json({ 
        message: 'Radio ID is required',
        bodyReceived: Object.keys(req.body),
        paramsReceived: Object.keys(req.params)
      });
    }
    
    try {
      console.log('isRadioAdmin: Checking if user', req.user.id, 'is admin of radio', radioId);
      // Check if user is the radio admin
      const [radios] = await db.query(
        'SELECT * FROM radios WHERE id = ? AND admin_id = ?',
        [radioId, req.user.id]
      );
      
      console.log('isRadioAdmin: Query result length:', radios.length);
      
      if (radios.length === 0) {
        console.log('isRadioAdmin: Access denied, user is not admin of this radio');
        return res.status(403).json({ 
          message: 'Access denied',
          reason: 'User is not the admin of this radio station'
        });
      }
      
      console.log('isRadioAdmin: Access granted');
      next();
    } catch (error) {
      console.error('isRadioAdmin: Error checking permissions:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error.message
      });
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
  console.log('Audio upload: Request received');
  console.log('Audio upload: Request body keys:', Object.keys(req.body));
  console.log('Audio upload: Request files:', req.files ? Object.keys(req.files) : 'No files');
  
  if (!req.files || !req.files.file) {
    console.log('Audio upload: No file found in request');
    return res.status(400).json({ 
      message: 'No file uploaded',
      requestInfo: {
        hasFiles: !!req.files,
        fileKeys: req.files ? Object.keys(req.files) : []
      }
    });
  }
  
  const { file } = req.files;
  console.log('Audio upload: File received:', file.name, file.mimetype, file.size);
  
  // Support both radioId and radio_id for compatibility
  const radioId = req.body.radio_id || req.body.radioId;
  const { title, type } = req.body;
  
  console.log('Audio upload: Form data:', { title, type, radioId });
  
  if (!title || !type || !radioId) {
    console.log('Audio upload: Missing required fields');
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: { 
        title: !!title, 
        type: !!type, 
        radioId: !!radioId 
      }
    });
  }
  
  // Validate file type
  if (!file.name.match(/\.(mp3|wav|ogg)$/)) {
    console.log('Audio upload: Unsupported file format:', file.name);
    return res.status(400).json({ message: 'Unsupported file format' });
  }
  
  try {
    console.log('Audio upload: Creating uploads directory if needed');
    // Create directory for radio if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads', radioId.toString());
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Audio upload: Created directory:', uploadDir);
    }
    
    // Save file
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    
    console.log('Audio upload: Saving file to:', filePath);
    await file.mv(filePath);
    console.log('Audio upload: File saved successfully');
    
    // Save to database
    console.log('Audio upload: Saving to database');
    const [result] = await db.query(
      'INSERT INTO audio_files (radio_id, title, type, file_path, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [radioId, title, type, `uploads/${radioId}/${fileName}`, file.mimetype, req.user.id]
    );
    console.log('Audio upload: Database insert success, ID:', result.insertId);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: result.insertId,
      filePath: `uploads/${radioId}/${fileName}`
    });
  } catch (error) {
    console.error('Audio upload: Error:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      message: 'Error uploading file',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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