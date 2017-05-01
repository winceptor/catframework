// server.js
var servicename = process.env.NAME || "server.js";


console.log("Starting service: " + servicename);
//console.log("###############################");

//check for configs before loading anything, create new configs if missing
var checkconfigs = require('./routes/configs');
var configs = ["secret", "config", "languages"];
if (!checkconfigs(configs)) {
	console.log("Problem with config files! Check ./config files and restart!");
	return;
}
else {
	console.log("Configs OK. Proceeding with load...");
}

var config = require('./config/config');
var secret = require('./config/secret');

var wip = config.wip || false;
if (wip) {
	console.log("Warning: Work in progress = true");
}
//console.log("###############################");

var server_port = process.env.PORT || secret.server_port || 8080;
var server_sslport = process.env.SSLPORT || secret.server_sslport || 8088;
var server_ip = process.env.IP || secret.server_ip || "localhost";

//var instagram_access_token = secret.instagram_access_token || '';

// set up ======================================================================
var fs = require('fs');
var compression = require('compression')

var express = require('express');
var app = express();

var http = require('http');
var https = require('https');

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var mongoStore = require('connect-mongo')(session);

var ejs = require('ejs');
var ejsmate = require('ejs-mate');

var helmet = require('helmet')

var moment = require('moment');

var privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.cert', 'utf8');
var credentials = {
	key: privateKey,
	cert: certificate
};



var files = require('./routes/files');
var logger = require('./routes/logger');

var translator = require('./routes/translator');
var catparser = require('./routes/catparser');

//var mapping = require('./routes/mapping');

var routes = require('./routes/routes');

/*
var InstagramAPI = require('instagram-api');
var instagramAPI = new InstagramAPI(instagram_access_token);

//testing instagram api
instagramAPI.userSelf().then(function(result) {
	console.log("Got instagram access!");
    console.log(result.data); // user info 
    console.log("api limit: " + result.limit); // api limit 
    console.log("api request remaining: " + result.remaining) // api request remaining 
}, function(err){
    console.log(err); // error info 
});
*/

// configuration ===============================================================
//Error handling, src: http://stackoverflow.com/a/14049430
mongoose.connection.on("open", function(ref) {
	return console.log("Connected to mongo server!".green);
});
mongoose.connection.on("error", function(err) {
	console.log("Could not connect to mongo server!".yellow);
	return console.log(err.message.red);
});

app.use(compression({
	level: 3
}));

app.use(helmet());

app.use(express.static(__dirname + '/public'));

//serve js and css plugin files (jquery and bootstrap)
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts')); // redirect fonts bootstrap

app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/moment/min')); // redirect JS moment


app.use('/js', express.static(__dirname + '/node_modules/eonasdan-bootstrap-datetimepicker/build/js')); // redirect datetimepicker JS
app.use('/css', express.static(__dirname + '/node_modules/eonasdan-bootstrap-datetimepicker/build/css')); // redirect CSS datetimepicker


//app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.engine('ejs', ejsmate);
app.set('view engine', 'ejs'); // set up ejs for templating

//mongostore connection
//fallback to regular sessionstorage if fails
app.use(function(req, res, next) {
	if (db_ok) {
		session({
			resave: true,
			saveUninitialized: true,
			secret: secret.db_secretkey,
			store: new mongoStore({
				url: secret.db_database,
				autoReconnect: true
			})
		})(req, res, next);
		//console.log("Sessions active.");
	}
	else {
		session({
			secret: secret.db_secretkey,
			resave: true,
			saveUninitialized: true
		})(req, res, next);
	}
});


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


//core middleware
app.use(logger);

//additional core middleware
app.use(translator);
app.use(catparser);

//pages
app.use(routes);


// connect to our database
var db_ok = false;
/*
mongoose.connect(secret.db_database, function(err) {
	if (err) {
		console.log("Failed to connect to: " + secret.db_database);
		db_ok = false;
		console.log("##############END##############");
	}
	else {
		console.log("Connected to the database!");
		db_ok = true;
		console.log("##############END##############");
	}
});
*/


// database ======================================================================
// connect to our database and handle reconnects http://stackoverflow.com/a/17093472
var db = mongoose.connection;
db.on('connecting', function() {
	console.log('connecting to MongoDB...');
});
db.on('error', function(error) {
	console.error('Error in MongoDb connection: ' + error);
	mongoose.disconnect();
});
db.on('connected', function() {
	console.log('MongoDB connected!');
	db_ok = true;
});
db.once('open', function() {
	console.log('MongoDB connection opened!');
});
db.on('reconnected', function() {
	console.log('MongoDB reconnected!');
	db_ok = true;
});
db.on('disconnected', function() {
	console.log('MongoDB disconnected!');
	db_ok = false;
	mongoose.connect(secret.db_database, {
		server: {
			auto_reconnect: true
		}
	});
});
mongoose.connect(secret.db_database, {
	server: {
		auto_reconnect: true
	}
});

// launch ======================================================================
var httpServer = http.createServer(app);
httpServer.listen(server_port, server_ip, function(err) {
	if (err) throw err;
	console.log("HTTP server is running on: " + server_ip + ":" + server_port);
});
/*
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(server_sslport, server_ip, function(err){
	if(err) throw err;
	console.log("HTTPS server is running on: " + server_ip + ":" + server_sslport);
});
*/
