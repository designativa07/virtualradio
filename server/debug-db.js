const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

// Print current environment variables
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST || 'Not set (using default: localhost)');
console.log('DB_USER:', process.env.DB_USER || 'Not set (using default: root)');
console.log('DB_NAME:', process.env.DB_NAME || 'Not set (using default: virtualradio)');
console.log('DB_PASS:', process.env.DB_PASS ? '***Set***' : 'Not set (using empty string)');
console.log('JWT_SECRET:', process.env.SESSION_SECRET ? '***Set***' : 'Not set (using fallback)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set (using development)');

async function testConnection() {
  console.log('\n--- Testing Database Connection ---');
  
  // Connection configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'virtualradio',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds
  };
  
  console.log('Connection config (without password):', {
    ...config,
    password: config.password ? '***hidden***' : '(empty)'
  });
  
  let connection;
  
  try {
    console.log('Attempting to create connection pool...');
    const pool = mysql.createPool(config);
    
    console.log('Getting connection from pool...');
    connection = await pool.getConnection();
    
    console.log('Connection successful! Testing query...');
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('Query result:', rows[0].solution);
    
    console.log('Checking existing tables in database...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Test radios table if it exists
    const radiosTable = tables.find(t => Object.values(t)[0] === 'radios');
    if (radiosTable) {
      console.log('\nTesting radios table...');
      const [radioCount] = await connection.query('SELECT COUNT(*) as count FROM radios');
      console.log('Number of radios in database:', radioCount[0].count);
      
      if (radioCount[0].count > 0) {
        const [sampleRadio] = await connection.query('SELECT * FROM radios LIMIT 1');
        console.log('Sample radio data:', sampleRadio[0]);
      }
    }
    
    console.log('\nAll database tests passed successfully!');
    
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nTROUBLESHOOTING: Database server refused connection. Check if:');
      console.error('1. MySQL server is running');
      console.error('2. Database hostname is correct');
      console.error('3. Database port is correct (default 3306)');
      console.error('4. No firewall is blocking the connection');
    } 
    else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nTROUBLESHOOTING: Access denied. Check if:');
      console.error('1. Database username is correct');
      console.error('2. Database password is correct');
    }
    else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\nTROUBLESHOOTING: Database does not exist. Check if:');
      console.error('1. Database name is correct');
      console.error('2. Database has been created');
    }
  } finally {
    if (connection) {
      console.log('Releasing connection...');
      connection.release();
    }
  }
}

// Run the test
testConnection().then(() => {
  console.log('Debug script completed');
  process.exit(0);
}).catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 