// DESATIVAÇÃO DO MODO OFFLINE
// Este arquivo foi modificado para garantir que não há modo offline
// Data: 04/05/2025

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Radio = require('./Radio');

console.log('Carregando modelo Music (modo online)');

// Definição do modelo Music - APENAS MODO ONLINE
const Music = sequelize.define('Music', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artist: {
    type: DataTypes.STRING,
    allowNull: true
  },
  album: {
    type: DataTypes.STRING,
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
  playCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
Music.belongsTo(Radio, { foreignKey: 'radioId' });
Radio.hasMany(Music, { foreignKey: 'radioId' });

module.exports = Music; 