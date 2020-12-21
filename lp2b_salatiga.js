var express = require('express')
  , http = require('http')
  , path = require('path')
  , logger = require('morgan')
  , bodyParser = require('body-parser')
  , methodOverride = require('method-override')
  , static = require('serve-static')
  , errorHandler = require('errorhandler')
  , passport = require('passport')
  , session = require('express-session')
  , cookieParser = require('cookie-parser')
  , flash = require("connect-flash")
  , LocalStrategy = require('passport-local').Strategy;

var login = require('./isine/login').router;
var peta = require('./isine/topojson');
var upload = require('./isine/upload_file');
var upload_shp = require('./isine/upload_shp');
var user = require('./isine/user');
var fn = require('./isine/ckeditor-upload-image');
var cek_login = require('./isine/login').cek_login;
var cek_login_front = require('./isine/login').cek_login_front;

var basic = require('./isine/basic');
var data_lp2b = require('./isine/data_lp2b');
var statistik = require('./isine/statistik');
var detail = require('./isine/detail');
var index_home = require('./isine/index_home');
var kepdin = require('./isine/kepdin')
var kontak = require('./isine/kontak')
var login_surveyor = require('./isine/login_surveyor')
var surveyor = require('./isine/surveyor')
var manajemen_basic = require('./isine/manajemen_basic');
var manajemen_master = require('./isine/manajemen_master');
var detail_lahan = require('./isine/detail_lahan');
var model_data = require('./models/detail_lahan');
var lblk_statistik = require('./isine/lblk_statistik');
var luas_statistik = require('./isine/luas_statistik')
var index_new = require('./isine/index_new');


var app = express();
var connection = require('./database').connection;
//var mysql2geojson = require("mysql2geojson");
var router = express.Router();
var dbgeo = require("dbgeo");
app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');


//end dbf dan shp
// all environments
app.set('port', process.env.PORT || 8857);

//app.use(express.favicon());
app.use(function (req, res, next) {

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
app.use(logger('dev'));
app.use(methodOverride());
app.use(static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  duration: 50 * 60 * 1000,
  activeDuration: 10 * 60 * 1000,
  secret: 'bhagasitukeren',
  cookie: { maxAge: 60 * 60 * 1000 },
  cookieName: 'session',
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// Add headers

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}
var server = http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server, { log: false });

//mulai apps ----------------------------------------------------------
app.use('/autentifikasi', login);
app.use('/peta', peta);
app.use('/upload', upload);
app.use('/upload_shp', upload_shp);
app.use('/user', user);
app.use('/uploadckeditor', fn);


app.use('/data_lp2b', data_lp2b);
app.use('/statistik', statistik);
app.use('/detail', detail);
app.use('/manajemen_basic', manajemen_basic);
app.use('/manajemen_master', manajemen_master);
app.use('/detail_lahan', detail_lahan);
app.use('/index_home', cek_login_front, index_home)

app.use('/lblk_statistik', lblk_statistik);
app.use('/luas_statistik', luas_statistik);
app.use('/kontak', kontak);
app.use('/surveyor', surveyor);
app.use('/index_new', index_new);
app.use('/login_surveyor', login_surveyor);


app.use('/basic', basic);

app.get('/', function (req, res) {
  model_data.findAll({})
    .then(data => {
      connection.query("SELECT x(centroid(a.the_geom)) as x,  y(centroid(a.the_geom)) as y, a.nama_kecamatan, a.id_kecamatan from master_kecamatan a", function(err, rows, fields){
        connection.query("select a.kec, a.jenis_lahan, sum(a.luas) as jml, (select sum(luas) from detailLahans where kec=a.kec) as tot from detailLahans a group by a.kec, a.jenis_lahan", function(err, statistik, fields){
        res.render('content/index_new', {
          user: req.user,
          data,
          kec: rows,
          statistik
        });
      })
      })
   
    })
    .catch(err => {
      res.status(400).json(err)
    })
});

app.get('/get_kel_bykec/:kec', function (req, res) {
  connection.query("select a.kel, sum(a.luas) as jml, sum(case when jenis_lahan = 'Lahan Basah' then a.luas else 0 end) AS jml_basah, sum(case when jenis_lahan = 'Lahan Kering' then a.luas else 0 end) AS jml_kering from detailLahans a where a.kec='"+req.params.kec+"' group by a.kel", function(err, data, fields){
    res.json(data);
  })
})


app.get('/data_by_kel/:kel', function (req, res) {
  connection.query("select a.*, b.nama as pemanfaatan_lahan from detailLahans a left join pemanfaatanLahans b on a.pemanfaatanLahanId=b.id where a.deleted=0 and a.kel='"+req.params.kel+"'", function(err, data, fields){
    res.json(data);
  })
})

app.get('/katam/:id_lahan', function (req, res) {
  connection.query("select a.*, b.nama as komoditas from katams a left join komoditas b on a.komoditaId=b.id where a.detailLahanId="+req.params.id_lahan, function(err, data, fields){
    res.json(data);
  })
})

app.get('/backoffice', cek_login, function (req, res) {
  console.log(req.user)
  res.render('content-backoffice/index');
});


// app.get('/4E26CD6CB47148CCFB9334CB15B95495.txt', function (req, res) {
//   console.log(req.user)
//   //res.render('7ECA9DC7A2167A6EB33B60F1DA8B85E1.txt');
//   var file = __dirname + '/4E26CD6CB47148CCFB9334CB15B95495.txt';
//     res.download(file);
// });
// app.listen(800, function () {
//   console.log('Example app listening on port 800!');
//admin
//mysql

app.use(function (req, res, next) {
  res.status(404).send("Halaman yang anda tuju tidak ada!")
})

  // < !--start socketio connection-- >

  //   io.sockets.on('connection', function (socket) {



  //   });