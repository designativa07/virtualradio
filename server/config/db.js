// DESATIVAÇÃO DO MODO OFFLINE
// Este arquivo foi modificado para garantir que não há modo offline
// Data: 04/05/2025

const { Sequelize } = require('sequelize');

console.log('Inicializando conexão com banco de dados (modo online)');
console.log('============= DETALHES DA CONEXÃO DB =============');

// Tenta carregar as variáveis de ambiente, se existirem
try {
  require('dotenv').config();
  console.log('Arquivo .env carregado');
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

// Log de configuração do banco de dados (sem mostrar a senha)
console.log(`Database: ${DB_CONFIG.dialect}://${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.name}`);

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
    },
    // Configuração adicional para tentar novamente em caso de falha
    retry: {
      max: 3,
      timeout: 5000
    }
  }
);

// Teste de conexão
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    console.log('============= FIM DOS DETALHES DB =============');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    console.error('Detalhes do erro:', err);
    console.error('* NÃO entrando em modo offline!');
    console.error('============= FIM DOS DETALHES DB =============');
  });

// Exportar a instância do sequelize
module.exports = sequelize;

// Testa a conexão, mas NÃO entra em modo offline em caso de falha 