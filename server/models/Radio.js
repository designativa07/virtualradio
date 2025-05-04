// DESATIVAÇÃO DO MODO OFFLINE
// Este arquivo foi modificado para garantir que não há modo offline
// Data: 04/05/2025

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

console.log('Carregando modelo Radio (modo online)');

// Definição do modelo Radio - APENAS MODO ONLINE
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  logo: {
    type: DataTypes.STRING,
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
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 2.0,
    comment: 'Duração do fade in em segundos'
  },
  fadeOutDuration: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 2.0,
    comment: 'Duração do fade out em segundos'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Definir relação com usuário
Radio.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Radio, { foreignKey: 'userId' });

module.exports = Radio; 