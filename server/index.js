const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const fs = require('fs');

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

// Static files - serve the Next.js build output
const nextDistPath = path.join(__dirname, '../client/dist');
const nextDotNextPath = path.join(__dirname, '../client/.next');
const nextPublicPath = path.join(__dirname, '../client/public');

// Check for static export (dist directory)
if (fs.existsSync(nextDistPath)) {
  console.log('Serving Next.js from dist directory (static export)');
  app.use(express.static(nextDistPath));
}

// Check for server-side rendering (.next directory)
if (fs.existsSync(nextDotNextPath)) {
  console.log('Serving Next.js from .next directory (server-side rendering)');
  app.use('/_next', express.static(path.join(__dirname, '../client/.next')));
}

// Always serve from public directory
if (fs.existsSync(nextPublicPath)) {
  console.log('Serving Next.js public files');
  app.use(express.static(nextPublicPath));
}

// Serve uploads directory
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

// Attempt to determine if we're using static export or server-side rendering
let usingSSR = false;
try {
  if (fs.existsSync(nextDotNextPath) && 
      fs.existsSync(path.join(nextDotNextPath, 'server'))) {
    usingSSR = true;
    console.log('Detected server-side rendering configuration');
  } else {
    console.log('Detected static export configuration');
  }
} catch (err) {
  console.error('Error detecting Next.js configuration:', err);
}

// Handle other routes
if (usingSSR) {
  // For SSR, we need to dynamically import the Next.js handler (not available in production)
  console.log('Attempting to fallback to static file serving for SSR build');
}

// Fallback to static serving
app.get('*', (req, res) => {
  // For now, use a simple static approach
  const staticPaths = [
    path.join(nextDistPath, 'index.html'),
    path.join(nextPublicPath, 'index.html'),
    path.join(__dirname, '../client/dist/index.html'),
    path.join(__dirname, '../client/public/index.html')
  ];

  // Try to find an index.html file to serve
  for (const indexPath of staticPaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html from ${indexPath}`);
      return res.sendFile(indexPath);
    }
  }

  // Create a simple fallback page
  const fallbackHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>VirtualRadio</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; }
        h1 { color: #333; }
        .box { background: #f7f7f7; padding: 20px; border-radius: 8px; border-left: 4px solid #0070f3; margin: 20px 0; }
        a { color: #0070f3; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>VirtualRadio</h1>
      <div class="box">
        <p>The application is running but the frontend was not built correctly.</p>
        <p>Please check:</p>
        <ul>
          <li>Your Next.js build configuration</li>
          <li>Server logs for detailed information</li>
        </ul>
        <p>Try the <a href="/api/test">API test endpoint</a> to verify the server is working.</p>
      </div>
    </body>
  </html>
  `;
  
  console.log('Serving fallback page - no index.html found');
  res.set('Content-Type', 'text/html');
  res.send(fallbackHTML);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VirtualRadio server running on port ${PORT}`);
  
  // Log server configuration
  console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Using SSR: ${usingSSR ? 'Yes' : 'No'}`);
}); 