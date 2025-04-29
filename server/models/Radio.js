const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

// Modo offline - mock do modelo Radio
const Radio = {
  findOne: async () => null,
  findByPk: async () => null,
  findAll: async () => [],
  create: async () => ({
    id: 1,
    name: 'Rádio Exemplo',
    description: 'Rádio de exemplo para o modo offline',
    spotInterval: 180,
    musicVolume: 70,
    spotVolume: 100,
    userId: 1
  }),
  destroy: async () => true,
  update: async () => ([1, [{id: 1}]]),
  belongsTo: () => {},
  hasMany: () => {}
};

// Comentado - código original
/*
const Radio = sequelize.define('Radio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  spotInterval: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 180, // 3 minutos em segundos
    comment: 'Intervalo entre spots em segundos'
  },
  musicVolume: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 70, // 70% do volume
    validate: {
      min: 0,
      max: 100
    }
  },
  spotVolume: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100, // 100% do volume
    validate: {
      min: 0,
      max: 100
    }
  },
  fadeInDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3, // 3 segundos
    comment: 'Duração do fade in em segundos'
  },
  fadeOutDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3, // 3 segundos
    comment: 'Duração do fade out em segundos'
  },
  volumeTransitionDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2, // 2 segundos
    comment: 'Duração da transição de volume em segundos'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
});

// Definir relação com usuário
Radio.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Radio, { foreignKey: 'userId' });
*/

module.exports = Radio; 