// Script para testar explicitamente a conexão com o banco de dados
console.log('===== TESTE DE CONEXÃO COM BANCO DE DADOS =====');

// Forçar modo online
process.env.OFFLINE_MODE = 'false';
global.OFFLINE_MODE = false;

// Importar Sequelize diretamente
const { Sequelize } = require('sequelize');

// Definição de valores padrão para as variáveis de ambiente
const DB_CONFIG = {
  name: process.env.DB_NAME || 'desig938_myradio',
  user: process.env.DB_USER || 'desig938_myradio',
  pass: process.env.DB_PASS || 'f}gjuk$sem6.',
  host: process.env.DB_HOST || '108.167.132.244', 
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
};

console.log('Tentando conectar a:');
console.log(`${DB_CONFIG.dialect}://${DB_CONFIG.user}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.name}`);

// Configuração do banco de dados
const sequelize = new Sequelize(
  DB_CONFIG.name,
  DB_CONFIG.user,
  DB_CONFIG.pass,
  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: DB_CONFIG.dialect,
    logging: console.log
  }
);

// Tentativa de conexão
console.log('Iniciando teste de conexão...');
sequelize.authenticate()
  .then(() => {
    console.log('✅ CONEXÃO BEM-SUCEDIDA!');
    console.log('O banco de dados está acessível e as credenciais estão corretas.');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FALHA NA CONEXÃO:');
    console.error(err);
    console.error('\nRECOMENDAÇÕES:');
    console.error('1. Verifique se o host do banco de dados está acessível (tente ping)');
    console.error('2. Confirme se as credenciais estão corretas');
    console.error('3. Verifique se o banco existe');
    console.error('4. Verifique se o firewall permite a conexão na porta especificada');
    process.exit(1);
  }); 