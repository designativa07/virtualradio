const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados usando variáveis de ambiente
const sequelize = new Sequelize(
  process.env.DB_NAME || 'desig938_myradio',
  process.env.DB_USER || 'desig938_myradio',
  process.env.DB_PASS || 'f}gjuk$sem6.',
  {
    host: process.env.DB_HOST || '108.167.132.244',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development',
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
    process.exit(1); // Encerrar o processo se não conseguir conectar ao banco
  }
};

testConnection();

module.exports = sequelize; 