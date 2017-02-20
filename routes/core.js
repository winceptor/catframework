var fs = require('fs');

var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');
var config = require('../config/config');

var countries = require('country-list')().getNames();
var sanitize = require('elasticsearch-sanitize');


var wip = config.wip || false;

//using format dd.mm.yyyy for date
function InputToDate(input)
{	
	if (input && input!="" && input.length>3)
	{
		var datenow = new Date();
		var parts = input.split(/\W/);
		if (parts && parts.length>=3)
		{
			var yyyy = parts[2];
			var mm = parts[1];
			var dd = parts[0];
			if (yyyy>1970 && yyyy<2038 && mm>0 && mm<13 && dd>0 && dd<32)
			{
				var date = new Date(parts[2], parts[1]-1, parts[0]);
				return date;
			}
		}
		return "";
	}
	return "";
}
function DateToInput(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	//no need for trailing zeros
	//if(dd<10){dd="0"+dd} 
	//if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	return dd + "." + mm + "." + yyyy;
}
function DateToOutput(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var dd = date.getDate(); 
	var mm = date.getMonth()+1; 
	var yyyy = date.getFullYear(); 
	//no need for trailing zeros
	//if(dd<10){dd="0"+dd} 
	//if(mm<10){mm="0"+mm} 
	//return yyyy+"-"+mm+"-"+dd;
	var hour = date.getHours(); 
	var min = date.getMinutes(); 
	if(hour<10){hour="0"+hour} 
	if(min<10){min="0"+min} 
	return dd + "." + mm + "." + yyyy + " " + hour + ":" + min;
}
function DateToTime(date) {
	if (!date || date=="" || date.length<3)
	{
		return "";
	}
	var date = new Date(Date.parse(date));
	var hour = date.getHours(); 
	var min = date.getMinutes(); 
	var sec = date.getSeconds();
	if(hour<10){hour="0"+hour} 
	if(min<10){min="0"+min} 
	if(sec<10){sec="0"+sec} 
	return hour + ":" + min + ":" + sec;
}
function DateToDate(date)
{
	return InputToDate(DateToInput(date));
}


//UNRESTRICTED MODE MIDDLEWARE
router.use(function(req, res, next){
	res.locals.zeroadmins = false;
	
	res.locals.localhostadmin = config.localhostadmin || false;
	res.locals.zeroadmins_unrestricted = config.zeroadmins_unrestricted || false;
	
	if (res.locals.zeroadmins_unrestricted)
	{
		User.count({admin:true}, function (err, count) {
			if (!err && count === 0) {
				res.locals.zeroadmins = true;
				var problem = "WARNING! RUNNING WITHOUT ACCESS RESTRICTIONS: CREATE MAIN ADMIN USER";
				req.flash('error',problem);
				console.log(problem);
				next();
			}
			else
			{
				next();
			}
		});
	}
	else
	{
		next();
	}
});

router.use(function(req, res, next) {
	res.locals.wip = wip;

	res.locals.logfile = config.log_filename;
	
	res.locals.sanitize = sanitize;
	
	res.locals.InputToDate = InputToDate;
	res.locals.DateToInput = DateToInput;
	res.locals.DateToDate = DateToDate;
	res.locals.DateToOutput = DateToOutput;
	
	var LastDay = new Date();
	LastDay.setDate(LastDay.getDate() - 1);
	res.locals.LastDay = DateToDate(LastDay);
	var Today = new Date();
	res.locals.Today = DateToDate(Today);
	var Datestamp = new Date();
	res.locals.Datestamp = DateToInput(Datestamp);
	var Timestamp = new Date();
	res.locals.Timestamp = DateToTime(Timestamp);
	
	res.locals.remoteip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";
	 
	res.locals.hosturl = "http://" + req.headers.host;
	
	res.locals.languagecode = "en";
	
	var admin = req.user && req.user.admin;
	var remoteip = "undefined"; 
	if (req.connection)
	{
		remoteip = req.connection.remoteAddress || remoteip;
	}	
	if (remoteip!="undefined" && req.socket)
	{
		remoteip = req.socket.remoteAddress || remoteip;
	}
	if (remoteip!="undefined" && req.connection && req.connection.socket)
	{
		remoteip = req.connection.socket.remoteAddress || remoteip;
	}	
	var localadmin = res.locals.localhostadmin && (remoteip=="localhost" || remoteip=="127.0.0.1" || remoteip=="::ffff:127.0.0.1" || remoteip=="::1");
	var zeroadmins = res.locals.zeroadmins;
	
	res.locals.hasadmin = admin || localadmin || zeroadmins;
	
	res.locals.filesizebeautify = function(filesize)
	{
		var filesize_kb = Math.round(filesize/1000);
		var filesize_mb = Math.round(filesize_kb/1000);
		var filesize_gb = Math.round(filesize_mb/1000);
		
		if (filesize_gb>0) {
			return filesize_gb + " GB";
		}
		if (filesize_mb>0) {
			return filesize_mb + " MB";
		}
		if (filesize_kb>0) {
			return filesize_kb + " KB";
		}
		return filesize + " B";
	}
	
	var referer = req.header('Referer') || '/';
	res.locals.referer = referer;
	//res.locals.referer = encodeURIComponent(referer);
	
	res.locals.user = req.user;

	res.locals.countries = countries;

	
	//res.locals.server_host = secret.server_host;
	res.locals.captchasite = secret.captcha_sitekey || "";
	res.locals.captchakey = secret.captcha_secretkey || "";
	res.locals.captchaapi = secret.captcha_api || "https://www.google.com/recaptcha/api/siteverify";
	
	if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === null) {
		req.body['g-recaptcha-response'] = '';
	}
	res.locals.captchaurl = res.locals.captchaapi + "?secret=" + res.locals.captchakey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
	

	//remove last / for canonical rel link url
	var canonicalpath = req.path;
	if (canonicalpath.slice(-1)=="/")
	{
		canonicalpath = canonicalpath.slice(0, -1);
	}
	res.locals.canonicalurl = res.locals.hosturl + canonicalpath;
	res.locals.canonicalpath = canonicalpath;
	
	res.locals.currenturl = res.locals.hosturl + req.originalUrl;
	res.locals.currentpath = req.originalUrl;
	
	next();
});



module.exports=router;