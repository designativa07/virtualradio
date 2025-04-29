const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Radio = require('./Radio');

// Modo offline - mock do modelo Music
const Music = {
  findOne: async () => null,
  findByPk: async () => null,
  findAll: async () => [],
  create: async (data) => ({
    id: 1,
    title: data?.title || 'Música Exemplo',
    artist: data?.artist || 'Artista Exemplo',
    filePath: data?.filePath || '/uploads/music/exemplo.mp3',
    duration: 180,
    radioId: 1
  }),
  destroy: async () => true,
  update: async () => ([1, [{id: 1}]]),
  belongsTo: () => {},
  hasMany: () => {}
};

// Comentado - código original
/*
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
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Caminho do arquivo no sistema'
  },
  youtubeId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID do vídeo do YouTube'
  },
  spotifyId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID da música no Spotify'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em segundos'
  },
  radioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Radio,
      key: 'id'
    }
  }
});

// Definir relação com rádio
Music.belongsTo(Radio, { foreignKey: 'radioId' });
Radio.hasMany(Music, { foreignKey: 'radioId' });
*/

module.exports = Music; 