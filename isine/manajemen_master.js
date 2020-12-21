var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  , sha1 = require('sha1');
var sql_enak = require('../database/mysql_enak.js').connection;
var cek_login = require('./login').cek_login;
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
var deasync = require('deasync');
const modelKomoditas = require('../models/komoditas')
const PemanfaatanLahan = require('../models/pemanfaatan_lahan')
path.join(__dirname, '/public/foto')
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.use(cookieParser());
router.use(passport.initialize());
router.use(passport.session());
router.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/foto/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})

var upload = multer({ storage: storage })

//start-------------------------------------
router.get('/komoditas', cek_login, function (req, res) {
  modelKomoditas.findAll({
    where: {
      deleted: 0
    }
  }).then( datane =>{
    res.render('content-backoffice/manajemen_komoditas/list', {datane}); 
  }).catch( errore =>{
    console.log(errore)
  })
  
});

router.get('/komoditas/insert', cek_login, function (req, res) {
  res.render('content-backoffice/manajemen_komoditas/insert');
});


router.get('/komoditas/edit/:id', cek_login, function (req, res) {
  modelKomoditas.findAll({
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.render('content-backoffice/manajemen_komoditas/edit', {datane}); 
  }).catch( errore =>{
    console.log(errore)
  })
  
});

router.get('/komoditas/delete/:id', cek_login, function(req, res) {
  modelKomoditas.update({deleted:1},{
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.redirect('/manajemen_master/komoditas')
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/komoditas/submit_insert', cek_login, function(req, res) {
  modelKomoditas.create(req.body).then( datane =>{
    res.redirect('/manajemen_master/komoditas')
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/komoditas/submit_edit', cek_login, function(req, res) {
  modelKomoditas.update(req.body, {
    where: {
      id: req.body.id
    }}).then( datane =>{
    res.redirect('/manajemen_master/komoditas')
  }).catch( errore =>{
    console.log(errore)
  })
});

router.get('/pemanfaatan_lahan', cek_login, function (req, res) {
  PemanfaatanLahan.findAll({
    where: {
      deleted: 0
    }
  }).then( datane =>{
    res.render('content-backoffice/manajemen_pemanfaatan_lahan/list', {datane}); 
  }).catch( errore =>{
    console.log(errore)
  })
  
});

router.get('/pemanfaatan_lahan/insert', cek_login, function (req, res) {
  res.render('content-backoffice/manajemen_pemanfaatan_lahan/insert');
});


router.get('/pemanfaatan_lahan/edit/:id', cek_login, function (req, res) {
  PemanfaatanLahan.findAll({
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.render('content-backoffice/manajemen_pemanfaatan_lahan/edit', {datane}); 
  }).catch( errore =>{
    console.log(errore)
  })
  
});

router.get('/pemanfaatan_lahan/delete/:id', cek_login, function(req, res) {
  PemanfaatanLahan.update({deleted:1},{
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.redirect('/manajemen_master/pemanfaatan_lahan')
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/pemanfaatan_lahan/submit_insert', cek_login, function(req, res) {
  PemanfaatanLahan.create(req.body).then( datane =>{
    res.redirect('/manajemen_master/pemanfaatan_lahan')
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/pemanfaatan_lahan/submit_edit', cek_login, function(req, res) {
  PemanfaatanLahan.update(req.body, {
    where: {
      id: req.body.id
    }}).then( datane =>{
    res.redirect('/manajemen_master/pemanfaatan_lahan')
  }).catch( errore =>{
    console.log(errore)
  })
});
module.exports = router;
