const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Radio = require('./Radio');

// Definição do modelo Spot
const Spot = sequelize.define('Spot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  youtubeId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em segundos'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Prioridade do spot (maior número = maior prioridade)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  radioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Definir relação com rádio
Spot.belongsTo(Radio, { foreignKey: 'radioId' });
Radio.hasMany(Spot, { foreignKey: 'radioId' });

module.exports = Spot; 