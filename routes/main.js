var express = require('express');
var router = express.Router();

var User = require('../models/user');

var secret = require('../config/secret');
var config = require('../config/config');

//var passport = require('./passport');



router.get('/', function(req, res) {
	res.render('main/index', { errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') }); // load the index.ejs file
});


router.get('/profile/:id',function(req,res,next){
	if (!req.params.id) {
		return next();
	}
	User.findById({_id:req.params.id}).exec(function(err, user) {
		if(err) return next(err);
		if (!user)
		{
			console.log("error null user");
			return next();
		}
		

		res.render('main/profile',{
			profile: user,
			errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info'), badgemessages:req.flash('badges')
		});


	});
});
router.get('/profile',function(req,res,next){
	if (req.user) {
		res.redirect('/profile/' + req.user.id);
	}
	else
	{
		res.redirect('/');
	}
});


router.get('/message',function(req, res, next){
	var query = req.query.q || "";
	var message = res.locals.catparse(query);

	var apijson = {
        status: "success"
    };
    
    	
	if (message.length<1) {
		apijson.status = 'empty';
		return res.send(JSON.stringify(apijson));
	}
	
	
    var sender = "(anon)";
	if (req.user) {
		sender = req.user.local.name;
	}
	req.socket_broadcast('message', "<strong>" + sender + "</strong>: " + message );


	console.log("Message received: " + query);
	return res.send(JSON.stringify(apijson));
});

router.get('/claim',function(req,res,next){
	if (!req.user || !res.locals.hasadmin) {
		return res.denied("###denied###");
	}
	User.findById({_id:req.user.id}).exec(function(err, user) {
		if(err) return next(err);
		if (!user)
		{
			console.log("error null user");
			return next();
		}
		user.admin = true;
		user.save(function(err) {
			if(err) return next(err);
			
			req.flash('success','Claimed page ownership by: ' + user.local.email);
			
			return res.redirect('/'); 
		});
		
	});
});
	

module.exports=router;