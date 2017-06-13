var fs = require('fs');

var express = require('express');
var router = express.Router();

var secret = require('../config/secret');
var config = require('../config/config');

var mainRoutes=require('./main');


var wip = config.wip || false;

//denied page
router.get('/denied',function(req,res){
	var content = "###error###" + " 403 - " + "###denied###";
	return res.status(403).render('main/messagepage',{result: 'error', content: content, closable: false, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
});

//crashtest page
if (wip) {
	router.get('/crash', function(req, res) {
		if (!res.locals.hasadmin) { return res.denied("###denied###"); }
		  process.nextTick(function () {
			throw new Error;
		  });
	})
	
	router.get('/restart', function(req, res) {
		if (!res.locals.hasadmin) { return res.denied("###denied###"); }
		process.exit(0);
	})
}

router.use(mainRoutes);

//missing page
router.use(function(req,res,next){
	var content = "###error###" + " 404 - " + "###missing###";
	return res.status(404).render('main/messagepage',{result: 'error', content: content, closable: false, errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')});
});

//JSON.stringify(data)
module.exports=router;
