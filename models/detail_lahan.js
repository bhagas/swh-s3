const db = require('../database/sq');
const moment = require('moment');
const { DataTypes } = require('sequelize');
const pemanfaatan_lahan = require('./pemanfaatan_lahan');

const DetailLahan = db.define('detailLahan', {
  // Model attributes are defined here
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  SHAPE:{
    type: DataTypes.GEOMETRY,
    defaultValue: null
  },
  no_lp2b: {
    type: DataTypes.STRING
  },
  no_bidang: {
    type: DataTypes.STRING
  },

  alamat: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  kec: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  kel: {
    type: DataTypes.STRING,
    defaultValue: ''
  },

  pemilik: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  penggarap: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  status_lahan: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  jenis_lahan: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  nop: {
    type: DataTypes.STRING,

  },
  
  status_lahan: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  luas: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  
  intensitas_tanam: {
    type: DataTypes.STRING
    , defaultValue: ''
  },
  status_irigasi: {
    type: DataTypes.STRING
    , defaultValue: ''
  },
  sistem_irigasi: {
    type: DataTypes.STRING
    , defaultValue: ''
  },
  nama_di: {
    type: DataTypes.STRING
    , defaultValue: ''
  },
  pengairan: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  keterangan: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  sumber_lp2b: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  foto2: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  tahun: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  deleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  id_user: {
    type: DataTypes.INTEGER
    
  },
  createdAt: {
    type: DataTypes.DATE,
  //note here this is the guy that you are looking for                   
  get() {
        return moment(this.getDataValue('createdAt')).format('DD-MM-YYYY h:mm:ss');
    }
  },
  updatedAt: {
    type: DataTypes.DATE,
  //note here this is the guy that you are looking for                   
  get() {
        return moment(this.getDataValue('updatedAt')).format('DD-MM-YYYY h:mm:ss');
    }
  }
}, {
  // Other model options go here
});

DetailLahan.belongsTo(pemanfaatan_lahan)
  pemanfaatan_lahan.hasMany(DetailLahan)
DetailLahan.sync({ alter: true })
module.exports = DetailLahan