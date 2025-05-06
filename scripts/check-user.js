const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function checkUsers() {
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
    
    // Check users table
    const [users] = await connection.query('SELECT * FROM users');
    console.log('Users in database:');
    console.log(users);
    
    // Check if admin user with ID 1 exists
    const [adminUser] = await connection.query('SELECT * FROM users WHERE id = 1');
    if (adminUser.length > 0) {
      console.log('\nAdmin user with ID 1 exists:', adminUser[0]);
    } else {
      console.log('\nAdmin user with ID 1 does NOT exist!');
      console.log('This could be causing the 500 error when creating radios');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsers(); 