const db = require('../database/sq');
const {DataTypes} = require('sequelize');

const Komoditas = db.define('komoditas', {
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

  Komoditas.sync({ alter: true })
  module.exports = Komoditas