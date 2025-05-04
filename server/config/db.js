const { Sequelize } = require('sequelize');

// Tenta carregar as variáveis de ambiente, se existirem
try {
  require('dotenv').config();
} catch (err) {
  console.log('Arquivo .env não encontrado, usando valores padrão');
}

// Definição de valores padrão para as variáveis de ambiente
const DB_CONFIG = {
  name: process.env.DB_NAME || 'desig938_myradio',
  user: process.env.DB_USER || 'desig938_myradio',
  pass: process.env.DB_PASS || 'f}gjuk$sem6.',
  host: process.env.DB_HOST || '108.167.132.244',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

// Configuração do banco de dados usando variáveis de ambiente ou valores padrão
const sequelize = new Sequelize(
  DB_CONFIG.name,
  DB_CONFIG.user,
  DB_CONFIG.pass,
  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: DB_CONFIG.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testar a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
    console.log('Tentando operar no modo offline (sem persistência)');
  }
};

// Testa a conexão, mas não encerra o processo em caso de falha
testConnection();

module.exports = sequelize; 