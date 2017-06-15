var fs = require('fs');

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');
var config = require('../config/config');

var countries = require('country-list')().getNames();
var sanitize = require('elasticsearch-sanitize');


var wip = config.wip || false;

Date.prototype.addHours = function(h) {
	this.setHours(this.getHours() + h);
	return this;
}

//using format dd.mm.yyyy for date
function InputToDate(input, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (input && input != "" && input.length > 3) {
		var datenow = new Date();
		var parts = input.split(/\W/);
		if (parts && parts.length >= 3) {
			var yyyy = parts[2];
			var mm = parts[1];
			var dd = parts[0];
			if (parts.length >= 5) {
				var hr = parts[3];
				var mn = parts[4];
				var date = new Date(yyyy, mm - 1, dd, hr, mn);
				date.addHours(-gmtoffset);
				return date;
			}
			if (yyyy > 1970 && yyyy < 2038 && mm > 0 && mm < 13 && dd > 0 && dd < 32) {
				var date = new Date(yyyy, mm - 1, dd);
				date.addHours(-gmtoffset);
				return date;
			}
		}
		return "";
	}
	return "";
}

function DateToInput(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	date.addHours(gmtoffset);

	var dd = date.getDate();
	var mm = date.getMonth() + 1;
	var yyyy = date.getFullYear();
	//no need for trailing zeros
	if(dd<10){dd="0"+dd} 
	if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	var mn = date.getMinutes();
	var hr = date.getHours();

	return dd + "." + mm + "." + yyyy + " " + hr + ":" + mn;
}

function DateToOutput(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	date.addHours(gmtoffset);
	var dd = date.getDate();
	var mm = date.getMonth() + 1;
	var yyyy = date.getFullYear();
	//no need for trailing zeros
	//if(dd<10){dd="0"+dd} 
	//if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	var hour = date.getHours();
	var min = date.getMinutes();
	if (hour < 10) {
		hour = "0" + hour
	}
	if (min < 10) {
		min = "0" + min
	}
	return dd + "." + mm + "." + yyyy + " " + hour + ":" + min;
	//return dd + "." + mm + "." + yyyy;
}

function DateToTime(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	date.addHours(gmtoffset);
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();
	if (hour < 10) {
		hour = "0" + hour
	}
	if (min < 10) {
		min = "0" + min
	}
	if (sec < 10) {
		sec = "0" + sec
	}
	return hour + ":" + min + ":" + sec;
}

function DateToDatestamp(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	date.addHours(gmtoffset);
	var dd = date.getDate();
	var mm = date.getMonth() + 1;
	var yyyy = date.getFullYear();

	if (dd < 10) {
		dd = "0" + dd
	}
	if (mm < 10) {
		mm = "0" + mm
	}

	return dd + "." + mm + "." + yyyy;
}

function DateToTimestamp(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	date.addHours(gmtoffset);
	var hour = date.getHours();
	var min = date.getMinutes();
	if (hour < 10) {
		hour = "0" + hour
	}
	if (min < 10) {
		min = "0" + min
	}

	return hour + ":" + min;
}

function DateToDate(date) {
	return InputToDate(DateToInput(date));
}


function InputToOutput(date) {
	return DateToOutput(InputToDate(date));
}

function DateToSimple(date, gmtoffset) {
	var gmtoffset = gmtoffset || 0;
	if (!date || date == "" || date.length < 3) {
		return "";
	}
	var date = new Date(Date.parse(date));
	var now = Date.now();
	var diff = now - date;

	var sec = diff/1000;
	var min = sec/60;
	var hour = min/60;
	var dd = hour/24;
	var mm = dd/30;
	var yyyy = dd/365;
	
	if (yyyy>=1) {
		return Math.round(yyyy) + " ###years### ###ago###";
	}
	if (mm>=1) {
		return Math.round(mm) + " ###month### ###ago###";
	}
	if (dd>=1) { 
		return Math.round(dd) + " ###days### ###ago###";
	}
	if (hour>=1) {
		return Math.round(hour) + " ###hours### ###ago###";
	}
	if (min>=1) {
		return Math.round(min) + " ###minutes### ###ago###";
	}
	if (sec>=1) {
		return Math.round(sec) + " ###seconds### ###ago###";
	}
	return "###moments### ###ago###";
}


//VARIOUS RESPONSES
router.use(function(req,res,next){
	//fatal error
	res.fatalerror = function(req, res, err) {
		var content = "ERROR" + " 400 - " + "Something went terribly wrong! Please contact administrator!";
		return res.status(400).render('main/messagepage',{result: 'error', content: content, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
	}

	//result message
	res.resultmessage = function(result, content) {
		return res.render('main/messagepage',{result: result, content: content, closable: true, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
	}
	
	res.missing = function(msg) {
		var content = "ERROR" + " 404 - " + msg;
		return res.status(404).render('main/messagepage',{result: 'error', content: content, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
	}
	
	res.denied = function(msg) {
		var content = "ERROR" + " 403 - " + msg;
		return res.status(403).render('main/messagepage',{result: 'error', content: content, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
	}
	next();
});



//UNRESTRICTED MODE MIDDLEWARE
router.use(function(req, res, next) {
	res.locals.zeroadmins = false;

	res.locals.localhostadmin = config.localhostadmin || false;
	res.locals.zeroadmins_unrestricted = config.zeroadmins_unrestricted || false;

	if (res.locals.zeroadmins_unrestricted) {
		User.count({
			admin: true
		}, function(err, count) {
			if (!err && count === 0) {
				res.locals.zeroadmins = true;
				console.log("WARNING! RUNNING WITHOUT ACCESS RESTRICTIONS: CREATE MAIN ADMIN USER");
				next();
			}
			else {
				next();
			}
		});
	}
	else {
		next();
	}
});

router.use(function(req, res, next) {
	res.locals.wip = wip;

	var gmtoffset = res.locals.gmtoffset || 0;

	
	res.locals.paginator_choices = config.paginator_choices || [10,30,50,100,250,1000];
	res.locals.paginator_default = config.paginator_default || config.paginator_choices[0] || 30;

	res.locals.logfile = config.log_filename;

	res.locals.sanitize = sanitize;

	var gmtoffsetcookie = req.cookies.gmtoffset;
	res.locals.gmtclient = gmtoffsetcookie || config.gmt_default || 0;
	res.locals.gmtclient = parseInt(res.locals.gmtclient);

	/*
	if (req.query && req.query.gmtoffset) {
		var gmtoffsetminutes = parseInt(req.query.gmtoffset);
		gmtoffset = -gmtoffsetminutes / 60;
		res.locals.gmtclient = gmtoffset;
	}*/

	res.cookie('gmtoffset', res.locals.gmtclient, {
		maxAge: 365 * 24 * 60 * 60 * 1000
	});

	res.locals.gmtserver = config.gmt_default || 0;
	res.locals.gmtserver = parseInt(res.locals.gmtserver);

	var gmtoffset = res.locals.gmtclient - res.locals.gmtserver;

	res.locals.InputToDate = function(date) {
		return InputToDate(date, gmtoffset);
	}
	res.locals.DateToInput = function(date) {
		return DateToInput(date, gmtoffset);
	}
	res.locals.DateToDate = function(date) {
		return DateToDate(date, gmtoffset);
	}
	res.locals.DateToOutput = function(date) {
		return DateToOutput(date, gmtoffset);
	}
	res.locals.DateToTime = function(date) {
		return DateToTime(date, gmtoffset);
	}
	res.locals.InputToOutput = function(date) {
		return InputToOutput(date, gmtoffset);
	}
	
	res.locals.DateToSimple = function(date) {
		return DateToSimple(date, gmtoffset);
	}

	var LastDay = new Date();
	LastDay.setDate(LastDay.getDate() - 1);
	res.locals.LastDay = DateToDate(LastDay);
	var Today = new Date();
	res.locals.Today = DateToDate(Today);
	var Datestamp = new Date();
	res.locals.Datestamp = DateToDatestamp(Datestamp);
	var Timestamp = new Date();
	res.locals.Timestamp = DateToTimestamp(Timestamp);

	res.locals.clientip = req.header('x-forwarded-for');

	res.locals.remoteip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";

	if (!req.secure) {
		res.locals.hosturl = "http://" + req.headers.host;
	}
	else {
		res.locals.hosturl = "https://" + req.headers.host;
	}

	res.locals.languagecode = "en";

	var admin = req.user && req.user.admin;
	var remoteip = "undefined";
	if (req.connection) {
		remoteip = req.connection.remoteAddress || remoteip;
	}
	if (remoteip != "undefined" && req.socket) {
		remoteip = req.socket.remoteAddress || remoteip;
	}
	if (remoteip != "undefined" && req.connection && req.connection.socket) {
		remoteip = req.connection.socket.remoteAddress || remoteip;
	}
	var localadmin = res.locals.localhostadmin && (remoteip == "localhost" || remoteip == "127.0.0.1" || remoteip == "::ffff:127.0.0.1" || remoteip == "::1");
	var zeroadmins = res.locals.zeroadmins;

	res.locals.hasadmin = admin || localadmin || zeroadmins;

	res.locals.filesizebeautify = function(filesize, type) {
		var type = type || "B";
		var filesize_kb = Math.round(filesize / 1000);
		var filesize_mb = Math.round(filesize_kb / 1000);
		var filesize_gb = Math.round(filesize_mb / 1000);

		if (filesize_gb > 0) {
			return filesize_gb + " G" + type;
		}
		if (filesize_mb > 0) {
			return filesize_mb + " M" + type;
		}
		if (filesize_kb > 0) {
			return filesize_kb + " K" + type;
		}
		return filesize + " " + type;
	}

	var referer = req.header('Referer') || '/';
	res.locals.referer = referer || '/';
	//res.locals.referer = encodeURIComponent(referer);

	res.locals.user = req.user;

	res.locals.countries = countries;


	//res.locals.server_host = secret.server_host;
	res.locals.captchasite = secret.captcha_sitekey || "";
	res.locals.captchakey = secret.captcha_secretkey || "";
	res.locals.captchaapi = secret.captcha_api || "https://www.google.com/recaptcha/api/siteverify";

	res.locals.googlemapskey = secret.google_maps_key || "";
	res.locals.googlemapsapi = secret.google_maps_api || "";

	if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
		req.body['g-recaptcha-response'] = '';
	}
	res.locals.captchaurl = res.locals.captchaapi + "?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;


	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1) == "/") {
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = res.locals.hosturl + canonicalpath;
	res.locals.canonicalpath = canonicalpath;

	res.locals.currenturl = res.locals.hosturl + req.originalUrl;
	res.locals.currentpath = req.originalUrl;

	next();
});


module.exports = router;
