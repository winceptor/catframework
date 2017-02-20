// server.js
var servicename = process.env.NAME || "server.js";

console.log("###############################");
console.log("Starting service: " + servicename);
console.log("###############################");

//check for configs before loading anything, create new configs if missing
var checkconfigs = require('./routes/configs');
var configs = ["secret","config","languages"];
if (!checkconfigs(configs)){
	console.log("Problem with config files! Check ./config files and restart!");
	return;
}
else
{
	console.log("Configs OK. Proceeding with load...");
}

var config =require('./config/config');
var wip = config.wip || false;
var secret =require('./config/secret');

var server_port     = process.env.PORT || secret.server_port || 8080;
var server_sslport     = process.env.SSLPORT || secret.server_sslport || 8088;

// set up ======================================================================
var fs = require('fs');
var compression = require('compression')

var express  = require('express');
var app      = express();

var http = require('http');
var https = require('https');

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var mongoStore = require('connect-mongo')(session);

var ejs = require('ejs');
var ejsmate = require('ejs-mate');

var helmet = require('helmet')



var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.cert', 'utf8');
var credentials = {key: privateKey, cert: certificate};



var files = require('./routes/files');
var logger = require('./routes/logger');

var translator = require('./routes/translator');
var catparser = require('./routes/catparser');

//var mapping = require('./routes/mapping');

var routes = require('./routes/routes');


// configuration ===============================================================
//mongoose.connect(configDB.url); // connect to our database
mongoose.connect(secret.db_database,function(err){
	if(err){
		console.log(err);
	}else {
		console.log("Connected to the database!");
	}
});

app.use(compression({level: 3}));

app.use(helmet());

app.use(express.static(__dirname+'/public'));

//app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.engine('ejs',ejsmate);
app.set('view engine', 'ejs'); // set up ejs for templating

app.use(session({
	resave:true,
	saveUninitialized:true,
	secret:secret.db_secretkey,
	store:new mongoStore({ url:secret.db_database, autoReconnect:true})
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//core middleware
app.use(logger);

app.use(routes);


// launch ======================================================================
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(secret.server_port, function(err){
	if(err) throw err;
	console.log("Server is running on port: "+ server_port);
});
httpsServer.listen(secret.server_sslport, function(err){
	if(err) throw err;
	console.log("Server is running on sslport: "+ server_sslport);
});
