// Test database connection with detailed diagnostics
require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('=== DATABASE CONNECTION TEST ===');
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PORT:', process.env.DB_PORT);

// Database configuration
const DB_CONFIG = {
  name: process.env.DB_NAME || 'desig938_myradio',
  user: process.env.DB_USER || 'desig938_myradio',
  pass: process.env.DB_PASS || 'f}gjuk$sem6.',
  host: process.env.DB_HOST || '108.167.132.244',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

console.log('\nAttempting connection with:');
console.log(`Host: ${DB_CONFIG.host}`);
console.log(`Database: ${DB_CONFIG.name}`);
console.log(`User: ${DB_CONFIG.user}`);
console.log(`Port: ${DB_CONFIG.port}`);

const sequelize = new Sequelize(
  DB_CONFIG.name,
  DB_CONFIG.user,
  DB_CONFIG.pass,
  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: DB_CONFIG.dialect,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

console.log('\nTesting connection...');
sequelize.authenticate()
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed!');
    console.error('Error details:', err.message);
    
    // Network error diagnostics
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(5000);  // 5 second timeout
    
    socket.on('connect', () => {
      console.log(`\n✅ Port ${DB_CONFIG.port} is reachable on ${DB_CONFIG.host}`);
      socket.destroy();
    });
    
    socket.on('timeout', () => {
      console.log(`\n❌ Connection timed out trying to reach ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.log('Possible causes:');
      console.log('1. Database server is down');
      console.log('2. Firewall is blocking the connection');
      console.log('3. Wrong host or port');
      socket.destroy();
    });
    
    socket.on('error', (error) => {
      console.log(`\n❌ Network error: ${error.message}`);
      console.log('Possible causes:');
      console.log('1. Host is unreachable');
      console.log('2. Wrong host address');
      console.log('3. Network connectivity issues');
      socket.destroy();
    });
    
    socket.connect(DB_CONFIG.port, DB_CONFIG.host);
  }); 