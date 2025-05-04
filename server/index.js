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

// Static files
app.use(express.static(path.join(__dirname, '../client/dist')));
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
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VirtualRadio server running on port ${PORT}`);
}); 