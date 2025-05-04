const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Log the database configuration (excluding password)
console.log('Database configuration:', {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'virtualradio',
  connectionLimit: 10,
});

let pool;

try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'virtualradio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds
    debug: process.env.NODE_ENV !== 'production',
  });
  
  // Test the connection
  pool.getConnection()
    .then(connection => {
      console.log('Database connection successful');
      connection.release();
      return pool;
    })
    .catch(err => {
      console.error('Error connecting to database:', err.message);
      // Don't throw error - allow app to continue with limited functionality
    });
} catch (err) {
  console.error('Failed to create database pool:', err.message);
  // Create a fallback pool that will fail gracefully
  pool = {
    execute: async () => { throw new Error('Database connection failed'); },
    query: async () => { throw new Error('Database connection failed'); },
    getConnection: async () => { throw new Error('Database connection failed'); }
  };
}

module.exports = pool; 