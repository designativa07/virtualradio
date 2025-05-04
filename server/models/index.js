const sequelize = require('../config/db');
const User = require('./User');
const Radio = require('./Radio');
const Music = require('./Music');
const Spot = require('./Spot');

// Definir todas as associações
// (já definidas em seus respectivos arquivos, mas repetindo aqui para clareza)
User.hasMany(Radio, { foreignKey: 'userId' });
Radio.belongsTo(User, { foreignKey: 'userId' });

Radio.hasMany(Music, { foreignKey: 'radioId' });
Music.belongsTo(Radio, { foreignKey: 'radioId' });

Radio.hasMany(Spot, { foreignKey: 'radioId' });
Spot.belongsTo(Radio, { foreignKey: 'radioId' });

// Função para sincronizar todos os modelos com o banco de dados
const syncModels = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados com o banco de dados.');
    return true;
  } catch (error) {
    console.error('Erro ao sincronizar modelos:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Radio,
  Music,
  Spot,
  syncModels
}; 