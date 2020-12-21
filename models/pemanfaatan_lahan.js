const db = require('../database/sq');
const {DataTypes} = require('sequelize');

const PemanfaatanLahan = db.define('pemanfaatanLahan', {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nama: {
        type: DataTypes.STRING
    },
    deleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
  }, {
    // Other model options go here
  });

  PemanfaatanLahan.sync({ alter: true })
  module.exports = PemanfaatanLahan