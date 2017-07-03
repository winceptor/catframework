var router= require('express').Router();

var User = require('../models/user');

var passport=require('passport');

var crypto = require('crypto');

var request = require('request');


//serialize and deserialize
passport.serializeUser(function(user,done){
	done(null,user._id);
});
passport.deserializeUser(function(id,done){
	User.findById(id,function(err,user){
		done(err,user);
	});
});


//var transporter = require('./mailer');


function SendVerification(user, res, cb) {
	if (!user) {
	  return;
	}	
	crypto.randomBytes(20, function(err, buf) {
		if(err) return cb(err, null);
		var token = buf.toString('hex');

	


		user.verifyToken = token;
		user.verifyExpires = Date.now() + 60*60*1000*24; // 1 day

		user.save(function(err) {
			if(err) return cb(err, null);
			
			var recipient = '"' + user.name + '" <' + user.email + '>';
			var title = res.locals.trans('###email### ###verification###');
			
			var mailParameters = {
				to: recipient, 
				subject: title, 
				token: token
			};
			var mailOptions = transporter.render('email/user-verification', mailParameters, res.locals);

			//Send e-mail
			transporter.sendMail(mailOptions, function(err, info){
				if(err){
					console.log("error sending email");
				   console.log(info);
				   return cb(err, null);
				}
				
				console.log('Message sent: ' + info.response);
				return cb(null, info);
			});		
		});
	});
}


//SIGNUP
router.get('/signup', function(req, res, next) {
	if (req.user) {
		res.redirect("/profile");
	}
	res.render('main/signup',{
		errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') 
	});
});
router.post('/signup',function(req,res,next){
	
	//var redirectpage = req.body.redirectpage || '/';

	var user = new User();

	var errors = user.processForm(req, res, true);
	if (errors && errors>0)
	{
		req.flash('error', errors);

		return res.redirect("/signup");
	}
	
	var usecaptcha = false;
	request(res.locals.captchaurl,function(error,response,body) {
		body = JSON.parse(body);
		if (usecaptcha && body.success !== undefined && !body.success) {
			req.flash('error',"Problem with captcha, please retry!");
			
			return res.redirect("/signup");
		} 
		else {

			User.findOne({'local.email' :  user.local.email},function(err,existingUser){
                if(err) return next (err);
                
				if(existingUser){
					req.flash('error','###user### ###alreadyexists###');

					return res.redirect("/signup");
				} else {
					
					user.save(function(err,user){
						if(err) return next (err);
						
						req.flash('success','###user### ###registered###');
						
						//SendVerification(user, res);
						
						req.logIn(user,function(err){
							if(err) return next(err);
							res.redirect("/");
						});
						
					});
				}
			});
		}
	});
});

//LOGIN
router.get('/login', function(req, res) {
    if (req.user) {
		res.redirect("/profile");
	}
	// render the page and pass in any flash data if it exists
	res.render('main/login', { 
	    
	    errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') 
	    
	}); 
});
router.post('/login', function(req, res, next) {

	var username = req.body.email;
	var password = req.body.password;
	
	if (!username || !password)
	{
		res.redirect("/login");
	}
	else
	{
		username = username.toLowerCase();
		//email = email.toLowerCase();
		User.findOne({'local.email' :  username},function(err,user){
			if(err) return next (err);
            //TODO find out why you have to use local.email instead of nested here
            
            //console.log("username: " + username);
			if(!user){
				req.flash('error','###usernameerror###');
				return res.redirect("/login");
			}
			if(!user.comparePassword(password)){
				req.flash('error','###passworderror###');
				return res.redirect("/login");
			}

			user.lastlogin = Date.now();
			user.lastip = req.connection.remoteAddress || req.socket.remoteAddress || "invalid";
			user.save(function(err) {
				if(err) return console.log(err);
			});

			req.flash('success','###loginsuccess###')
			req.logIn(user,function(err){
				if(err) return next(err);
				res.redirect("/");
			});
		});
	}
});

//EDIT
router.get('/editprofile',function(req,res,next){
	if (!req.user) { return res.denied("###denied###"); }
	res.render('main/editprofile',{
	    profile:req.user, 
	    errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') 
	});
});
router.post('/editprofile',function(req,res,next){
	if (!req.user) { return res.denied("###denied###"); }
	

	User.findById(req.user._id, function(err, user) {
		if(err) return next (err);

		var errors = user.processForm(req, res, true);
    	if (errors && errors>0)
    	{
    		req.flash('error', errors);


			return res.redirect('/editprofile');
		}
		
		User.findOne({'local.email': req.body.email},function(err,existingUser){
			if(err) return next(err);
			if(existingUser && existingUser._id.toString()!=user._id.toString()){
				req.flash('error','###user### ###alreadyexists###');

				return res.redirect('/editprofile');
			} else {
				user.save( 
					function(err, results) {
						if(err) return next(err);
						if (!results)
						{
							req.flash('error', '###user### ###not### ###edited###!');
							return res.redirect('/editprofile');
						}

						req.flash('success','###user### ###edited###');
			
						res.redirect('/profile');
					}
				);
			}
		});	
	});
});




//VERIFICATIONS
 
router.get('/verify/:token', function(req, res, next) {
	User.findOne({ verifyToken: req.params.token, verifyExpires: { $gt: Date.now() } }, function(err, user) {
		if(err) return next (err);
		if (!user) {
			req.flash('error', 'Verify token is invalid or has expired.');
			return res.redirect('/login');
		}
		user.verifyToken = undefined;
        user.verifyExpires = undefined;
		user.verified = true;
		user.save(function(err) {
			if(err) return next (err);
			req.flash('success', 'Your account is now verified!');
			return res.redirect('/login');
		});
	});
});
router.get('/reverify',function(req,res,next){
	if (!req.user) { return res.redirect("/"); }
	//SendVerification(req.user, res, function(err, result) {});
	req.flash('success', 'An e-mail with verification link has been sent.');
	res.redirect("/");
});

  


router.get('/recovery', function(req, res) {
  res.render('main/recovery', {
		profile: false,
		errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') 
  });
});

//http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/
router.post('/recovery', function(req, res, next) {
    var usecaptcha = false;
	request(res.locals.captchaurl,function(error,response,body) {
		body = JSON.parse(body);
		if (usecaptcha && (body.success !== undefined && !body.success) ) {
			req.flash('error',"Problem with captcha, please retry!");
			
			return res.redirect('/recovery');
		} 
		else {
			crypto.randomBytes(20, function(err, buf) {
				if(err) return next (err);
				var token = buf.toString('hex');

				User.findOne({ 'local.email': req.body.email }, function(err, user) {
					if(err) return next (err);
					if (!user) {
					  req.flash('error', 'No account with that email address exists.');
					  return res.redirect('/recovery');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 60*60*1000; // 1 hour

					user.save(function(err) {
						if(err) return next (err);
						
						console.log("Password reset link generated for email: " + req.body.email);
						console.log(res.locals.hosturl + "/reset/" + token);
						
						if (typeof transporter == "undefined") {
						    req.flash('success', '###recovery### ###sent###');
						    return res.redirect("/");
						}
						
					    var recipient = '"' + user.name + '" <' + user.email + '>';
						var title = '###forgotpass###';
							
						var mailParameters = {
								to: recipient, 
								subject: title,
								token: token
							};
						var mailOptions = transporter.render('email/user-forgotpass', mailParameters, res.locals);
						//Send e-mail
						transporter.sendMail(mailOptions, function(error, info){
							if(error){
							   return console.log(error);
							}
							console.log('Message sent: ' + info.response);
							req.flash('success', '###email### ###sent###');
							
							return res.redirect("/");
						});	
						
					});
				});
			});
		}
	});
});


router.get('/reset/:token', function(req, res, next) {
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if(err) return next (err);
		if (!user) {
			req.flash('error', 'Password reset token is invalid or has expired.');
			return res.redirect('/forgot');
		}
		res.render('main/reset', {
			errormessages: req.flash('error'), successmessages:req.flash('success'), infomessages:req.flash('info') 
		});
	});
});

router.post('/reset/:token', function(req, res, next) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err) return next (err);
		if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }

        user.local.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
		
		var errors = user.validateForm(req, res);
		if (req.body.password=="")
		{
			errors.push("Enter password!");
		}

        if (errors && errors>0)
    	{
    		req.flash('error', errors);


			return res.redirect('/reset/' + req.params.token);
		}
		
        user.save(function(err) {
			if(err) return next (err);
			req.logIn(user, function(err) {
				if(err) return next (err);
				
				if (typeof transporter == "undefined") {
				    req.flash('success', '###password### ###changed###');
					
    				res.redirect("/");
				}
				
				var recipient = '"' + user.name + '" <' + user.email + '>';
				var title = '###password### ###changed###';
				//var message = 'Hello ' + user.name + ',\n\n' +
          //'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
				
				var mailParameters = {
						to: recipient, 
						subject: title, 
					};
				var mailOptions = transporter.render('email/user-newpass', mailParameters, res.locals);
						
				//Send e-mail
				transporter.sendMail(mailOptions, function(error, info){
					if(error){
					   return console.log(error);
					}
					//console.log('Message sent: ' + info.response);
					req.flash('success', '###password### ###changed###');
					
					res.redirect("/");
				});	
				
				
				
			});
        });
    });
});



//LOGOUT
router.get('/logout',function(req,res,next){
	if (!req.user) { return res.redirect("/"); }
	req.flash('success','###logoutsuccess###')
	req.logout();
	res.redirect("/");
});


module.exports= router;