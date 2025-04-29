const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Radio = require('./Radio');

// Modo offline - mock do modelo Spot
const Spot = {
  findOne: async () => null,
  findByPk: async () => null,
  findAll: async () => [],
  create: async (data) => ({
    id: 1,
    name: data?.name || 'Spot Exemplo',
    description: data?.description || 'Descrição do spot de exemplo',
    filePath: data?.filePath || '/uploads/spot/exemplo.mp3',
    duration: 30,
    isActive: true,
    radioId: 1
  }),
  destroy: async () => true,
  update: async () => ([1, [{id: 1}]]),
  belongsTo: () => {},
  hasMany: () => {}
};

// Comentado - código original
/*
const Spot = sequelize.define('Spot', {
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
  filePath: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Caminho do arquivo no sistema'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duração em segundos'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de início da veiculação'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data de término da veiculação'
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
Spot.belongsTo(Radio, { foreignKey: 'radioId' });
Radio.hasMany(Spot, { foreignKey: 'radioId' });
*/

module.exports = Spot; 