const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || 'virtualradioappsecretkey';

// Middleware for JWT verification - with detailed logging
const verifyToken = (req, res, next) => {
  console.log('Debug: Verifying token...');
  console.log('Debug: Request headers:', req.headers);
  
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('Debug: Token present:', token ? 'Yes' : 'No');
  
  if (!token) {
    console.log('Debug: No token provided');
    return res.status(401).json({ 
      message: 'Not authenticated',
      error: 'No token provided' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Debug: Token verified successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Debug: Error verifying token:', error.message);
    return res.status(401).json({ 
      message: 'Invalid token',
      error: error.message 
    });
  }
};

// Basic status route that doesn't need auth
router.get('/status', (req, res) => {
  const serverInfo = {
    status: 'online',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(serverInfo);
});

// Test database connection
router.get('/db-status', async (req, res) => {
  try {
    // Try to dynamically import database
    const db = require('../config/database');
    
    try {
      // Try to get a connection to test database
      const connection = await db.getConnection();
      connection.release();
      
      res.json({
        status: 'connected',
        message: 'Database connection successful'
      });
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: dbError.message,
        code: dbError.code
      });
    }
  } catch (importError) {
    console.error('Failed to import database module:', importError);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import database module',
      error: importError.message
    });
  }
});

// Mock radios endpoint that doesn't need database
router.get('/mock-radios', (req, res) => {
  console.log('Debug: Accessing mock-radios (no auth required)');
  
  // Generate some mock radio data
  const mockRadios = [
    {
      id: 1,
      name: 'Mock Radio 1',
      description: 'This is a mock radio for debugging',
      admin_id: 1,
      admin_username: 'Admin',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Mock Radio 2',
      description: 'Another mock radio for testing',
      admin_id: 1,
      admin_username: 'Admin',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({ 
    radios: mockRadios,
    message: 'Mock data provided for debugging purposes',
    isMock: true
  });
});

// Mock radio creation endpoint that doesn't need database
router.post('/mock-radio', (req, res) => {
  console.log('Debug: Creating mock radio with data:', req.body);
  
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Radio name is required' });
  }
  
  // Generate a mock success response for radio creation
  const mockRadioId = Math.floor(Math.random() * 1000) + 100; // Random ID between 100-1100
  
  res.status(201).json({
    message: 'Radio created successfully (mock)',
    radioId: mockRadioId,
    mockData: true,
    isMock: true,
    radio: {
      id: mockRadioId,
      name: name,
      description: description || '',
      admin_id: 1,
      admin_username: 'Admin',
      created_at: new Date().toISOString()
    }
  });
});

// Add a debugging logs endpoint
router.get('/logs', (req, res) => {
  const logPath = path.join(__dirname, '../../logs');
  
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
      return res.json({
        status: 'info',
        message: 'Logs directory created, no logs available yet'
      });
    }
    
    // Read log files
    const files = fs.readdirSync(logPath);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    if (logFiles.length === 0) {
      return res.json({
        status: 'info',
        message: 'No log files found'
      });
    }
    
    // Get the latest log file
    const latestLog = logFiles.sort().pop();
    const logContent = fs.readFileSync(path.join(logPath, latestLog), 'utf8');
    
    // Split log into lines and get the last 50 lines
    const logLines = logContent.split('\n').filter(Boolean);
    const lastLines = logLines.slice(-50);
    
    res.json({
      status: 'success',
      logFile: latestLog,
      totalLines: logLines.length,
      lastLines: lastLines
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to read log files',
      error: error.message
    });
  }
});

// Add an environment variables endpoint (without sensitive info)
router.get('/env', (req, res) => {
  // Only return non-sensitive environment variables
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000',
    DB_HOST: process.env.DB_HOST ? '[SET]' : '[NOT SET]',
    DB_USER: process.env.DB_USER ? '[SET]' : '[NOT SET]',
    DB_NAME: process.env.DB_NAME ? '[SET]' : '[NOT SET]',
    SESSION_SECRET: process.env.SESSION_SECRET ? '[SET]' : '[NOT SET]',
  };
  
  res.json({
    environment: safeEnv,
    hostname: require('os').hostname(),
    platform: process.platform,
    arch: process.arch
  });
});

// Mock single radio endpoint that doesn't need database
router.get('/mock-radio/:id', (req, res) => {
  const radioId = req.params.id;
  console.log('Debug: Fetching mock radio with ID:', radioId);
  
  // Generate a mock radio detail
  const mockRadio = {
    id: parseInt(radioId),
    name: `Mock Radio ${radioId}`,
    description: `This is a mock radio for debugging with ID ${radioId}`,
    admin_id: 1,
    admin_username: 'Admin',
    created_at: new Date().toISOString()
  };
  
  res.json({ 
    radio: mockRadio,
    message: 'Mock radio data provided for debugging purposes',
    isMock: true 
  });
});

// Mock audio files for a radio
router.get('/mock-audio/radio/:radioId', (req, res) => {
  const radioId = req.params.radioId;
  console.log('Debug: Fetching mock audio files for radio ID:', radioId);
  
  // Generate mock audio files
  const mockFiles = [
    {
      id: 1001,
      radio_id: parseInt(radioId),
      title: 'Mock Song 1',
      type: 'music',
      file_path: 'uploads/mock/music-file-1.mp3',
      created_at: new Date().toISOString()
    },
    {
      id: 1002,
      radio_id: parseInt(radioId),
      title: 'Mock Commercial',
      type: 'spot',
      file_path: 'uploads/mock/spot-file-1.mp3',
      created_at: new Date().toISOString()
    },
    {
      id: 1003,
      radio_id: parseInt(radioId),
      title: 'Mock Song 2',
      type: 'music',
      file_path: 'uploads/mock/music-file-2.mp3',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({ 
    files: mockFiles,
    message: 'Mock audio files provided for debugging purposes',
    isMock: true 
  });
});

// Rota para verificar a tabela de rádios
router.get('/check-radios', async (req, res) => {
  try {
    const db = require('../config/database');
    
    // Verificar se a tabela existe
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'radios'
    `, [process.env.DB_NAME]);
    
    if (tables.length === 0) {
      return res.json({
        status: 'error',
        message: 'Tabela radios não encontrada',
        tables: []
      });
    }
    
    // Verificar estrutura da tabela
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'radios'
    `, [process.env.DB_NAME]);
    
    // Verificar dados
    const [radios] = await db.query('SELECT * FROM radios');
    
    res.json({
      status: 'ok',
      tableExists: true,
      columns: columns,
      radioCount: radios.length,
      radios: radios
    });
  } catch (error) {
    console.error('Erro ao verificar tabela de rádios:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar tabela de rádios',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check users table
router.get('/check-users', async (req, res) => {
  try {
    // Check if users table exists
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users'
    `);
    
    const tableExists = tables.length > 0;
    
    if (!tableExists) {
      return res.json({
        status: 'error',
        message: 'Users table does not exist'
      });
    }
    
    // Get users table structure
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
    `);
    
    // Get user count
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = countResult[0].count;
    
    // Get all users
    const [users] = await db.query('SELECT id, username, email, role FROM users');
    
    res.json({
      status: 'ok',
      tableExists: true,
      columns,
      userCount,
      users
    });
  } catch (error) {
    console.error('Error checking users table:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Check audio_files table
router.get('/check-audio-files', async (req, res) => {
  try {
    // Check if audio_files table exists
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'audio_files'
    `);
    
    const tableExists = tables.length > 0;
    
    if (!tableExists) {
      return res.json({
        status: 'error',
        message: 'Audio files table does not exist'
      });
    }
    
    // Get audio_files table structure
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'audio_files'
    `);
    
    // Get audio files count
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM audio_files');
    const audioFilesCount = countResult[0].count;
    
    // Get all audio files
    const [audioFiles] = await db.query(`
      SELECT af.*, u.username as uploaded_by_username
      FROM audio_files af
      LEFT JOIN users u ON af.uploaded_by = u.id
    `);
    
    res.json({
      status: 'ok',
      tableExists: true,
      columns,
      audioFilesCount,
      audioFiles
    });
  } catch (error) {
    console.error('Error checking audio_files table:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Debug audio upload endpoint that doesn't need authentication
router.post('/audio-upload', async (req, res) => {
  console.log('Debug: Audio upload request received');
  console.log('Debug: Request body:', req.body);
  console.log('Debug: Request files:', req.files ? Object.keys(req.files) : 'No files');
  
  try {
    if (!req.files || !req.files.file) {
      console.log('Debug: No file found in request');
      return res.status(400).json({
        message: 'No file uploaded',
        requestBody: req.body,
        filesKeys: req.files ? Object.keys(req.files) : []
      });
    }
    
    const { file } = req.files;
    const { title, type, radio_id } = req.body;
    const radioId = radio_id || req.body.radioId || '999'; // Default for testing
    
    console.log('Debug: File details:', {
      filename: file.name,
      size: file.size,
      mimetype: file.mimetype
    });
    
    console.log('Debug: Form data:', { title, type, radioId });
    
    // Create mock uploads directory
    const uploadDir = path.join(__dirname, '../../uploads/debug');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save file with timestamp to avoid conflicts
    const fileName = `${Date.now()}_debug_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    
    await file.mv(filePath);
    console.log('Debug: File saved to:', filePath);
    
    // Return success response
    res.status(201).json({
      message: 'File uploaded successfully (debug mode)',
      debug: true,
      file: {
        originalName: file.name,
        savedAs: fileName,
        path: `uploads/debug/${fileName}`,
        size: file.size,
        mimetype: file.mimetype
      },
      requestDetails: {
        title: title || 'No title provided',
        type: type || 'No type provided',
        radioId: radioId
      }
    });
  } catch (error) {
    console.error('Debug: Error in audio upload:', error);
    res.status(500).json({
      message: 'Error uploading file in debug mode',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 