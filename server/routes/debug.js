const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || 'jwt_secret_key';

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
router.get('/mock-radios', verifyToken, (req, res) => {
  console.log('Debug: Authenticated user for mock-radios:', req.user);
  
  // Generate some mock radio data
  const mockRadios = [
    {
      id: 1,
      name: 'Mock Radio 1',
      description: 'This is a mock radio for debugging',
      admin_id: req.user.id,
      admin_username: req.user.username || 'Admin',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Mock Radio 2',
      description: 'Another mock radio for testing',
      admin_id: req.user.id,
      admin_username: req.user.username || 'Admin',
      created_at: new Date().toISOString()
    }
  ];
  
  res.json({ radios: mockRadios });
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

module.exports = router; 