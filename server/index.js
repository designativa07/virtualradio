const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const session = require('express-session');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  useTempFiles: true,
  tempFileDir: path.join(__dirname, 'tmp'),
  createParentPath: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Static files for Next.js - serve both dist and .next depending on which exists
const nextDistPath = path.join(__dirname, '../client/dist');
const nextDotNextPath = path.join(__dirname, '../client/.next');
const nextPublicPath = path.join(__dirname, '../client/public');

// Check which directory exists and use that
try {
  if (require('fs').existsSync(nextDistPath)) {
    app.use(express.static(nextDistPath));
    console.log('Serving Next.js from dist directory');
  } else if (require('fs').existsSync(nextDotNextPath)) {
    app.use('/_next', express.static(nextDotNextPath));
    app.use(express.static(nextPublicPath));
    console.log('Serving Next.js from .next directory');
  } else {
    console.warn('Warning: Next.js build directories not found');
  }
} catch (err) {
  console.error('Error checking Next.js directories:', err);
}

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/radio', require('./routes/radio'));
app.use('/api/audio', require('./routes/audio'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API working correctly' });
});

// Serve SPA for any other route
app.get('*', (req, res) => {
  const indexPath = require('fs').existsSync(path.join(nextDistPath, 'index.html')) 
    ? path.join(nextDistPath, 'index.html')
    : path.join(nextPublicPath, 'index.html');
  
  try {
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built properly. Please check the build process.');
    }
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).send('Server error when trying to serve the application');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VirtualRadio server running on port ${PORT}`);
}); 