const { Sequelize } = require('sequelize');

// Modo offline - Sequelize falso
const sequelizeMock = {
  define: () => {
    return {
      belongsTo: () => {},
      hasMany: () => {}
    };
  },
  sync: async () => true,
  authenticate: async () => true
};

console.log('Modo offline ativado: usando mock do banco de dados');

// Linha comentada - configuração real
/*
const sequelize = new Sequelize('desig938_myradio', 'desig938_myradio', 'f}gjuk$sem6.', {
  host: '108.167.132.244',
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Testar a conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
};

testConnection();
*/

module.exports = sequelizeMock; 