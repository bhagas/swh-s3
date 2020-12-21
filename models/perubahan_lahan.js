const db = require('../database/sq');
const {DataTypes} = require('sequelize');
const detailLahan = require('./detail_lahan');
const Perubahan_lahan = db.define('perubahan_lahan', {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    luas: {
        type: DataTypes.STRING
    },
    tahun: {
        type: DataTypes.STRING
    }
  }, {
    // Other model options go here
  });
  Perubahan_lahan.belongsTo(detailLahan);
  detailLahan.hasMany(Perubahan_lahan);
  Perubahan_lahan.sync({ force: true })
  module.exports = Perubahan_lahan