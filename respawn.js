var printprefix = "# ";
var printdivider = "#############RESPAWN###########";

console.log(printdivider);

var ejs = require('ejs');
var fs = require('fs');


//check for configs before loading anything, create new configs if missing
var checkconfigs = require('./routes/configs');
var configs = ["secret", "config", "languages"];
if (!checkconfigs(configs)) {
	console.log(printprefix + "Problem with config files! Check ./config files and restart!");
	return;
}
else {
	//console.log("Configs OK. Proceeding with load...");
}

var config = require('./config/config');

var secret = require('./config/secret');
var respawn = require('respawn');

var appname = config.appname || "nodeapp";
var filename = 'server.js';

var monitor = respawn(['node', filename], {
	name: appname, // set monitor name
	env: {
		ENV_VAR: 'test'
	}, // set env vars
	cwd: '.', // set cwd
	maxRestarts: 3, // how many restarts are allowed within 60s
	// or -1 for infinite restarts
	sleep: 1000, // time to sleep between restarts,
	kill: 1000 // wait 30s before force killing after stopping
})


if (config.notify_crashes) {
	var nodemailer = require('nodemailer');
	var smtpTransport = require('nodemailer-smtp-transport');


	var transporter = nodemailer.createTransport(smtpTransport({
		host: secret.email_host,
		port: secret.email_port,
		secure: secret.email_secure, // use SSL
		auth: {
			user: secret.email_user,
			pass: secret.email_pass
		}
	}));

	transporter.sender = '"' + secret.email_sender + '" <' + secret.email_user + '>';

	var notifyadmin = function(lasterror) {
		var recipient = '"' + config.notify_name + '" <' + config.notify_email + '>';
		var subject = appname + ' has crashed!';

		var mailOptions = {
			from: transporter.sender, // sender address
			to: recipient, // list of receivers
			subject: subject, // Subject line
			text: lasterror // html of message
		};

		//Send e-mail
		transporter.sendMail(mailOptions, function(error, info) {
			if (error) {
				console.log(error);
			}
			console.log(printprefix + 'Message sent: ' + info.response);
		});
	}
}

monitor.on('stdout', function(data) {
	process.stdout.write(data.toString());
})

var lasterror = "";
monitor.on('stderr', function(data) {
	lasterror = data.toString();
	process.stdout.write(lasterror);
})


monitor.on('start', function() {
	console.log(printprefix + "Started: " + filename + " (" + appname + ")");
})


monitor.on('stop', function() {
	console.log(printprefix + "Stopped: " + filename + " (" + appname + ")");
	if (config.notify_crashes) {
		notifyadmin(lasterror);
	}
})

monitor.start() // spawn and watch

process.on('SIGTERM', function() {
	monitor.stop(function() {
		process.exit(0);
	})
});
