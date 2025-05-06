const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function runFixScript() {
  let connection;
  
  try {
    // Connect to MySQL using the fixed credentials from database.js
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'desig938_myradio',
      password: 'giNdvTR[l*Tm',
      database: 'desig938_myradio',
      multipleStatements: true
    });
    
    console.log('Connected to database successfully');
    
    // Read and execute SQL script
    const sqlPath = path.join(__dirname, 'fix-permissions.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running fix script...');
    const [results] = await connection.query(sqlScript);
    
    // Log the results - last result is the sample radio
    console.log('Script executed successfully!');
    
    if (Array.isArray(results) && results.length > 0) {
      console.log('Sample radio created:');
      console.log(results[results.length - 1]);
    } else {
      console.log('Script executed but no sample radio was returned.');
    }
    
  } catch (error) {
    console.error('Error running fix script:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runFixScript(); 