var connection = require('../database').connection;
var express = require('express');
var router = express.Router();
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , static = require('serve-static')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , path = require('path')
  ,  sha1 = require('sha1');
var sql_enak = require('../database/mysql_enak.js').connection;
var cek_login_front = require('./login').cek_login_front;
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
var detail_lahan = require('../models/detail_lahan');
var pemanfaatan_lahan = require('../models/pemanfaatan_lahan');
var komoditas = require('../models/komoditas');
var perubahan_lahan = require('../models/perubahan_lahan');
var katam = require('../models/katam');
const { parse } = require('wkt');
var sequelize = require('sequelize');
var {Op} = require('sequelize');

path.join(__dirname, '/public/foto')
  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  router.use(cookieParser() );
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
    cb(null, Date.now()+'-'+file.originalname)
  }
})

var upload = multer({ storage: storage })

//start-------------------------------------
router.get('/dashboard', cek_login_front, function(req, res) {
  res.render('content/dashboard'); 
});


router.get('/list',cek_login_front, function (req, res) {
  detail_lahan.findAll({
    where: {
      deleted: 0,
      kel:req.user[0].kel,
      SHAPE: {
      [Op.ne]: null
    }
    },
    attributes: {
      include :[
          [sequelize.fn('centroid', sequelize.col('SHAPE')), 'koordinat'],
        ]
      },
    include: [{
      model: pemanfaatan_lahan,
     }]
  }).then(data =>{
    // console.log(data.dataValues.koordinat)

    res.render('content/list', {data});
  }).catch(err => {
    res.status(400).json(err)
  })
    
});
router.get('/insert', cek_login_front, function (req, res) {
  pemanfaatan_lahan.findAll({
    where: {
      deleted: 0
    }
  }).then(pemanfaatan_lahan =>{
    connection.query("SELECT nama_kecamatan from master_kecamatan where nama_kecamatan=(select kec from master_kelurahan where nama_kelurahan='"+req.user[0].kel+"')", function(err, kec, fields) {
      res.render('content/insert',{kec,pemanfaatan_lahan, kel:req.user[0].kel }); 
    })
  })
});
router.post('/insert', cek_login_front, upload.fields([{ name: 'sumber_lp2b', maxCount: 1 },{ name: 'foto2', maxCount: 1 }]), function (req, res) {
  var post = {};
  post = req.body;
  if (req.files) {
    if (req.files['sumber_lp2b']) {
      var nama_file = req.files['sumber_lp2b'][0].filename;
      // nama_file = nama_file.slice(0, -4)
      post['sumber_lp2b'] = nama_file;
    }
    if (req.files['foto2']) {
      var nama_file = req.files['foto2'][0].filename;
      // nama_file = nama_file.slice(0, -4)
      post['foto2'] = nama_file;
    }
  }
  post['SHAPE'] = parse(post['SHAPE']);
  post.id_user=req.user[0].id_user;
  detail_lahan.create(post)
    .then(data => {
      console.log(data);
      perubahan_lahan.create({detailLahanId:data.id, luas:req.body.luas, tahun:req.body.tahun}).then(x =>{
        res.redirect('/surveyor/list')
      })
      
    })
    .catch(err => {
      res.status(400).json(err)
    })

});

router.post('/edit', cek_login_front, upload.fields([{ name: 'sumber_lp2b', maxCount: 1 },{ name: 'foto2', maxCount: 1 }]), function (req, res) {
  var post = {};
  post = req.body;
  if (req.files) {
    if (req.files['sumber_lp2b']) {
      var nama_file = req.files['sumber_lp2b'][0].filename;
      // nama_file = nama_file.slice(0, -4)
      post['sumber_lp2b'] = nama_file;
    }
    if (req.files['foto2']) {
      var nama_file = req.files['foto2'][0].filename;
      // nama_file = nama_file.slice(0, -4)
      post['foto2'] = nama_file;
    }
  }
  post.id_user=req.user[0].id_user;
  post['SHAPE'] = parse(post['SHAPE']);
  detail_lahan.update(post, {
    where: {
      id: req.body.id
    }
  }).then(data => {
    res.redirect('/surveyor/list')
  }).catch(error => {
    console.log(error)
  })
});

router.get('/edit/:id', cek_login_front, function (req, res) {
  detail_lahan.findAll({
    where: {
      deleted: 0,
      id: req.params.id
    },
    attributes:{
      include:[
        [sequelize.fn('asWkt', sequelize.col('SHAPE')), 'wktt']
      ]
    },
  }).then(data =>{
    connection.query("SELECT nama_kecamatan from master_kecamatan where nama_kecamatan=(select kec from master_kelurahan where nama_kelurahan='"+req.user[0].kel+"')", function(err, kec, fields) {
      connection.query("SELECT * from pemanfaatanLahans where deleted=0", function(err, lahan, fields) {
          res.render('content/edit',{kec, data, lahan, kel:req.user[0].kel }); 
        })
      
    })
    })
    // res.render('content-backoffice/manajemen_basic/edit'); 

});


// router.get('/katam/:id', cek_login_front, function(req, res) {
//   res.render('content/katam'); 
// });

router.get('/katam/:id', cek_login_front, function (req, res) {
  detail_lahan.findAll({
    where: {
      deleted: 0,
      id:req.params.id
    }
  }).then(data =>{
    katam.findAll({
      where:{
        detailLahanId:req.params.id
      },
      include: [{
        model: komoditas,
       }]
    }).then(katam =>{
    connection.query("SELECT * from komoditas where deleted=0", function(err, komoditas, fields) {
      
    //res.json({data, komoditas, katam})
    res.render('content/katam', {data, komoditas, katam});
    
  })
})
  }).catch(err => {
    res.status(400).json(err)
  })
    
});

router.get('/lahan/:id', cek_login_front, function (req, res) {

  detail_lahan.findAll({
    where: {
      deleted: 0,
      id:req.params.id
    }
  }).then(data =>{
    perubahan_lahan.findAll({
      where:{
        detailLahanId:req.params.id
      }
    }).then(perubahan_lahan =>{
    
      
    //res.json({data, komoditas, katam})
    res.render('content/lahan', {data, perubahan_lahan});
    

})
  }).catch(err => {
    res.status(400).json(err)
  })
    
})

router.post('/submit_katam', cek_login_front, function(req, res) {
  katam.create(req.body).then( datane =>{
    res.redirect('/surveyor/katam/'+req.body.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/submit_perubahan_lahan', cek_login_front, function(req, res) {
  perubahan_lahan.create(req.body).then( datane =>{
    res.redirect('/surveyor/lahan/'+req.body.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
 
});
router.get('/delete_katam/:id_katam/:detailLahanId', cek_login_front, function (req, res) {
  katam.destroy({
    where:{
      id:req.params.id_katam
    }
  }).then( datane =>{
    res.redirect('/surveyor/katam/'+req.params.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
})
router.get('/delete_perubahan_lahan/:id_perubahan/:detailLahanId', cek_login_front, function (req, res) {
  perubahan_lahan.destroy({
    where:{
      id:req.params.id_perubahan
    }
  }).then( datane =>{
    res.redirect('/surveyor/lahan/'+req.params.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
})

router.get('/delete/:id', cek_login_front, function(req, res) {
  detail_lahan.update({deleted:1},{
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.redirect('/surveyor/list')
  }).catch( errore =>{
    console.log(errore)
  })
 
});
module.exports = router;
