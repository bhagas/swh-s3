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
var cek_login_front = require('./login').cek_login_front;
var detail_lahan = require('../models/detail_lahan');
var pemanfaatan_lahan = require('../models/pemanfaatan_lahan');
var komoditas = require('../models/komoditas');
var perubahan_lahan = require('../models/perubahan_lahan');
var katam = require('../models/katam');
var cek_login_google = require('./login').cek_login_google;
var dbgeo = require("dbgeo");
var multer = require("multer");
var st = require('knex-postgis')(sql_enak);
var deasync = require('deasync');
const sq = require('sequelize');

const { parse } = require('wkt');

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
router.get('/cetak_excel', cek_login, function (req, res) {
  var q={};
  q.deleted=0;
  if(req.query.kec!=''){
    q.kec=req.query.kec;
  }

  if(req.query.kel!=''){
    q.kel=req.query.kel;
  }
  console.log(q);
  detail_lahan.findAll({
    
    where: q, 
    attributes:{
      include:[
        [sq.fn('centroid', sq.col('SHAPE')), 'tengah']
      ]
    },
    include: [{
      model: pemanfaatan_lahan,
     }]
  }).then(data =>{
    console.log(data[0])
    
    res.render('content-backoffice/manajemen_basic/cetak_excel', {data});
    
    //res.json({data})
  }).catch(err => {
    res.status(400).json(err)
  })
  
  
});

router.get('/cetak/:id', cek_login, function (req, res) {
  detail_lahan.findAll({
    where: {
      deleted: 0,
      id: req.params.id
    },
    attributes:{
      include:[
        [sq.fn('asWkt', sq.col('SHAPE')), 'wktt']
      ]
    },
  }).then(data =>{
 
    connection.query("SELECT nama_kecamatan from master_kecamatan", function(err, kec, fields) {
      connection.query("SELECT * from pemanfaatanLahans where deleted=0", function(err, lahan, fields) {
           res.render('content-backoffice/manajemen_basic/cetak',{kec, data, lahan }); 
          //res.json({kec, data, lahan })
        })
    })
    }).catch(err=>{
      console.log(err)
    })
  // res.render('content-backoffice/manajemen_basic/cetak');
});

router.get('/list', cek_login, function (req, res) {
  detail_lahan.findAll({
    limit:500,
    where: {
      deleted: 0,
    },
    attributes:{
      include:[
        [sq.fn('centroid', sq.col('SHAPE')), 'tengah']
      ]
    },
    include: [{
      model: pemanfaatan_lahan,
     }]
  }).then(data =>{
    console.log(data[0])
    connection.query("SELECT nama_kecamatan from master_kecamatan", function(err, kec, fields) {
    res.render('content-backoffice/manajemen_basic/list', {data, kec});
    })
    //res.json({data})
  }).catch(err => {
    res.status(400).json(err)
  })
    
});


router.get('/insert', cek_login, function (req, res) {
  pemanfaatan_lahan.findAll({
    where: {
      deleted: 0
    }
  }).then(pemanfaatan_lahan =>{
    connection.query("SELECT nama_kecamatan from master_kecamatan", function(err, kec, fields) {
      res.render('content-backoffice/manajemen_basic/insert',{kec,pemanfaatan_lahan }); 
    })
  })
});


router.get('/get_kel/:kec', function (req, res) {
  connection.query("SELECT x(centroid(the_geom)) as x,  y(centroid(the_geom)) as y, nama_kelurahan from master_kelurahan where kec='"+req.params.kec+"'", function(err, kec, fields) {
  res.json(kec)
  })
});

router.post('/insert', cek_login, upload.fields([{ name: 'sumber_lp2b', maxCount: 1 },{ name: 'foto2', maxCount: 1 }]), function (req, res) {
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
        res.redirect('/detail_lahan/list')
      })
      
    })
    .catch(err => {
      res.status(400).json(err)
    })

});
// router.post('/edit/:id', cek_login, function (req, res) {
//   // req.body.iduser = req.user[0].id_user
//   const { no_bidang, alamat, kec, kel, pemilik, penggarap, status_lahan, luas, pemanfaatan_lahan, Intensitas_tanam, status_irigasi, nama_di, pengairan, no_foto, keterangan, sumber_lp2b } = req.body
//   const { id } = req.params
//   detail_lahan.update({ no_bidang, alamat, kec, kel, pemilik, penggarap, status_lahan, luas, pemanfaatan_lahan, Intensitas_tanam, status_irigasi, nama_di, pengairan, no_foto, keterangan, sumber_lp2b }, { where: { id } })
//     .then(data => {
//       res.render('content-backoffice/manajemen_basic/edit')
//     })
//     .catch(err => {
//       res.status(400).json(err)
//     })

// });
router.post('/edit', cek_login, upload.fields([{ name: 'sumber_lp2b', maxCount: 1 },{ name: 'foto2', maxCount: 1 }]), function (req, res) {
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
  detail_lahan.update(post, {
    where: {
      id: req.body.id
    }
  }).then(data => {
    res.redirect('/detail_lahan/list')
  }).catch(error => {
    console.log(error)
  })
});


router.get('/edit/:id', cek_login, function (req, res) {
  detail_lahan.findAll({
    where: {
      deleted: 0,
      id: req.params.id
    },
    attributes:{
      include:[
        [sq.fn('asWkt', sq.col('SHAPE')), 'wktt']
      ]
    },
  }).then(data =>{
 
    connection.query("SELECT nama_kecamatan from master_kecamatan", function(err, kec, fields) {
      connection.query("SELECT * from pemanfaatanLahans where deleted=0", function(err, lahan, fields) {
        
          res.render('content-backoffice/manajemen_basic/edit',{kec, data, lahan }); 
          // res.json({kec, data, lahan })
        })
      
    })
    }).catch(err=>{
      console.log(err)
    })
    // res.render('content-backoffice/manajemen_basic/edit'); 

});

router.get('/katam/:id', cek_login, function (req, res) {
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
    res.render('content-backoffice/manajemen_basic/katam', {data, komoditas, katam});
    
  })
})
  }).catch(err => {
    res.status(400).json(err)
  })
    
});

router.get('/lahan/:id', cek_login, function (req, res) {

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
    res.render('content-backoffice/manajemen_basic/lahan', {data, perubahan_lahan});
    

})
  }).catch(err => {
    res.status(400).json(err)
  })
    
})

router.post('/submit_katam', cek_login, function(req, res) {
  katam.create(req.body).then( datane =>{
    res.redirect('/detail_lahan/katam/'+req.body.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
 
});

router.post('/submit_perubahan_lahan', cek_login, function(req, res) {
  perubahan_lahan.create(req.body).then( datane =>{
    res.redirect('/detail_lahan/lahan/'+req.body.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
 
});
router.get('/delete_katam/:id_katam/:detailLahanId', cek_login, function (req, res) {
  katam.destroy({
    where:{
      id:req.params.id_katam
    }
  }).then( datane =>{
    res.redirect('/detail_lahan/katam/'+req.params.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
})
router.get('/delete_perubahan_lahan/:id_perubahan/:detailLahanId', cek_login, function (req, res) {
  perubahan_lahan.destroy({
    where:{
      id:req.params.id_perubahan
    }
  }).then( datane =>{
    res.redirect('/detail_lahan/lahan/'+req.params.detailLahanId)
  }).catch( errore =>{
    console.log(errore)
  })
})

router.get('/delete/:id', cek_login, function(req, res) {
  detail_lahan.update({deleted:1},{
    where: {
      id: req.params.id
    }
  }).then( datane =>{
    res.redirect('/detail_lahan/list')
  }).catch( errore =>{
    console.log(errore)
  })
 
});
module.exports = router;
