const express = require('express');
const cors = require('cors');
const db = require('../server/config/database');
const jwt = require('jsonwebtoken');

// Create a simple express app to test the route
const app = express();
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.SESSION_SECRET || 'virtualradioappsecretkey';

// Create a test token with admin credentials
const createTestToken = () => {
  const user = {
    id: 1,
    username: 'Admin',
    email: 'admin@virtualradio.com',
    role: 'admin'
  };
  
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

// Test endpoint for creating a radio
app.post('/test-create-radio', async (req, res) => {
  const { name, description } = req.body;
  const adminId = 1; // Hardcoded admin ID for testing
  
  if (!name) {
    return res.status(400).json({ message: 'Radio name is required' });
  }
  
  try {
    console.log('Trying to create radio with:', { name, description, adminId });
    
    const [result] = await db.query(
      'INSERT INTO radios (name, admin_id, description) VALUES (?, ?, ?)',
      [name, adminId, description || '']
    );
    
    console.log('Radio created successfully with ID:', result.insertId);
    
    res.status(201).json({
      message: 'Radio created successfully',
      radioId: result.insertId,
      radioDirect: {
        id: result.insertId,
        name,
        description,
        admin_id: adminId
      }
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

// Start the test server
const PORT = 3030;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  
  // Generate a test token
  const token = createTestToken();
  console.log('Test token for CURL requests:');
  console.log(token);
  
  console.log('\nTest this endpoint with:');
  console.log(`curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${token}" -d '{"name":"Test Radio","description":"Test Description"}' http://localhost:${PORT}/test-create-radio`);
}); 