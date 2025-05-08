const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Log da configuração do banco de dados (excluindo senha)
console.log('Configuração do banco de dados:', {
  host: process.env.DB_HOST || 'site-designativa_myradio-sql',
  user: process.env.DB_USER || 'desig938_myradio',
  database: process.env.DB_NAME || 'desig938_myradio',
  connectionLimit: 10,
});

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'site-designativa_myradio-sql',
  user: process.env.DB_USER || 'desig938_myradio',
  password: process.env.DB_PASS || 'VirtualRadio123',
  database: process.env.DB_NAME || 'desig938_myradio',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});

// Exportar o pool de conexões
module.exports = pool.promise(); 