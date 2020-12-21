const db = require('../database/sq');
const {DataTypes} = require('sequelize');
const komoditas = require('./komoditas');
const detailLahan = require('./detail_lahan');
const Katam = db.define('katam', {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bulan_awal: {
        type: DataTypes.STRING
    },
    bulan_akhir: {
        type: DataTypes.STRING
    },
    ton: {
        type: DataTypes.STRING
    },
    tahun: {
        type: DataTypes.STRING
    }
  }, {
    // Other model options go here
  });
  Katam.belongsTo(komoditas);
  Katam.belongsTo(detailLahan);
  komoditas.hasMany(Katam);
  detailLahan.hasMany(Katam);
  Katam.sync({ alter: true })
  module.exports = Katam