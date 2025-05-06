const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function debugRadioCreation() {
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
    
    // Check existing radios
    const [radios] = await connection.query('SELECT * FROM radios');
    console.log('Existing radios:');
    console.log(radios);
    
    // Look at the radios table structure
    const [tableInfo] = await connection.query('DESCRIBE radios');
    console.log('\nRadios table structure:');
    console.log(tableInfo);
    
    // Try to create a test radio
    try {
      const testRadioName = 'Test Radio ' + Date.now();
      console.log('\nTrying to create test radio:', testRadioName);
      
      const [result] = await connection.query(
        'INSERT INTO radios (name, admin_id, description) VALUES (?, ?, ?)',
        [testRadioName, 1, 'Test description']
      );
      
      console.log('Radio created successfully with ID:', result.insertId);
      
      // Verify the new radio
      const [newRadio] = await connection.query('SELECT * FROM radios WHERE id = ?', [result.insertId]);
      console.log('New radio details:', newRadio[0]);
    } catch (insertError) {
      console.error('Error creating test radio:', insertError);
    }
    
  } catch (error) {
    console.error('Error in database operations:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugRadioCreation(); 