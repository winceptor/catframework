var express = require('express');
var router = express.Router();

var User = require('../models/user');
var secret = require('../config/secret');
var config = require('../config/config');

var passport = require('./passport');

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

// =====================================
// HOME PAGE (with login links) ========
// =====================================
router.get('/', function(req, res) {
	res.render('main/index', { errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') }); // load the index.ejs file
});

// =====================================
// LOGIN ===============================
// =====================================
// show the login form
router.get('/login', function(req, res) {

	// render the page and pass in any flash data if it exists
	res.render('main/login', { errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') }); 
});

// process the login form
router.post('/login', passport.authenticate('local-login', {
	successRedirect : '/profile', // redirect to the secure profile section
	failureRedirect : '/login', // redirect back to the signup page if there is an error
	failureFlash : true // allow flash messages
}));


// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
router.get('/signup', function(req, res) {

	// render the page and pass in any flash data if it exists
	res.render('main/signup', { errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') });
});

// process the signup form
router.post('/signup', passport.authenticate('local-signup', {
	successRedirect : '/profile', // redirect to the secure profile section
	failureRedirect : '/signup', // redirect back to the signup page if there is an error
	failureFlash : true // allow flash messages
}));


// =====================================
// FORGOT ==============================
// =====================================
// show the signup form
router.get('/recovery', function(req, res) {

	// render the page and pass in any flash data if it exists
	res.render('main/recovery', { errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') });
});

// process the signup form
router.post('/recovery', function(req,res,next){
	console.log("Recover email: " + req.body.email);
	res.redirect('/');
});

// =====================================
// PROFILE SECTION =====================
// =====================================

router.get('/profile/:id',function(req,res,next){
	if (!req.params.id) {
		return next();
	}
	User.findById({_id:req.params.id}).populate('userbadges').exec(function(err, user) {
		if(err) return next(err);
		if (!user)
		{
			console.log("error null user");
			return next();
		}

		res.render('main/profile',{
			profile: user,
			
			errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info')
		});
	});
});

// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
router.get('/profile', isLoggedIn, function(req, res) {
	if (req.user) {
		res.redirect('/profile/' + req.user.id);
	}
	else
	{
		res.redirect('/');
	}
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});


router.get('/search',function(req,res,next){
	var query = req.query.q || "";

	res.redirect('/');
});

router.get('/message',function(req,res,next){
	var query = req.query.q || "";

	req.flash('success','Message sent: ' + query);
	res.redirect('/');
	console.log("Message received: " + query);

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
			res.redirect('/');
		});
		
	});
});
	

module.exports=router;