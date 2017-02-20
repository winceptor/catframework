// routes/passport.js
var passport= require('passport');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User = require('../models/user');


// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

// =========================================================================
// LOCAL SIGNUP ============================================================
// =========================================================================
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

passport.use('local-signup', new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) {

		// asynchronous
		// User.findOne wont fire unless data is sent back
		process.nextTick(function() {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
		User.findOne({ 'local.email' :  email }, function(err, user) {
			// if there are any errors, return the error
			if (err)
				return done(err);

			// check to see if theres already a user with that email
			if (user) {
				return done(null, false, req.flash('message', '###emailtakenerror###'));
			} else {

				// if there is no user with that email
				// create the user
				var newUser            = new User();

				// set the user's local credentials
				newUser.local.email    = email;
				//newUser.local.password = newUser.generateHash(password);
				newUser.local.password = password;

				newUser.lastlogin = Date.now();
				
				newUser.lastip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";
		
				// save the user
				newUser.save(function(err) {
					if (err)
						throw err;
					return done(null, newUser);
				});
			}

		});    

		});

	}
));

passport.use('local-login',new LocalStrategy({
	usernameField:'email',
	passwordField:'password',
	passReqToCallback:true
},function(req,email,password,done){
	email = email.toLowerCase();
	User.findOne({ 'local.email' :  email },function(err,user){
		if(err) return done(err);

		if(!user){
			return done(null,false,req.flash('message','###usernameerror###'));
		}
		if(!user.validPassword(password)){
			return done(null,false,req.flash('message','###passworderror###'));
		}

		user.lastlogin = Date.now();
		user.lastip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";
		
		user.save(function(err) {
			if(err) return console.log(err);
		});

		req.flash('message','###loginsuccess###')
		return done(null,user);
	});
}));

module.exports = passport;