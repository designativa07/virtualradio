const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function initDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true
    });
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'virtualradio'}`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'virtualradio'}`);
    
    // Read and execute SQL script
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    await connection.query(sqlScript);
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase(); 