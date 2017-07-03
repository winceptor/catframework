// models/user.js
// load the things we need
var mongoose =require('mongoose');
var mongoosastic = require('mongoosastic');
var bcrypt   = require('bcrypt-nodejs');

var Schema= mongoose.Schema;

// define the schema for our user model
var userSchema = Schema({
    socket_hash: String,
    admin:{ type: Boolean, default: false },
    local            : {
        name         : String,
        email        : String,
        password     : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },

	lastlogin:{ type: Date, default: Date.now },
	lastip:{ type: String, default: '' },
	created:{ type: Date, default: Date.now },

	resetPasswordToken: String,
	resetPasswordExpires: Date,
	verifyToken: String,
	verifyExpires: Date	
});

/*Hash the password before we save it to the database */
userSchema.pre('save',function(next){
	var user=this;
	if (!user.isModified('local.password')) return next ();
	bcrypt.genSalt(10,function(err,salt){
		if(err) return next(err);
		bcrypt.hash(user.local.password, salt,null,function(err,hash) {
			if(err) return next (err);
			user.local.password=hash;
			next();
		});
	});
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.comparePassword = function(password){
	return bcrypt.compareSync(password, this.local.password);
}

userSchema.methods.processForm = function(req, res, signup){
	if (res.locals.hasadmin)
	{
		this.admin = req.body.admin || (res.locals.zeroadmins && signup);
	}

	this.local.name = req.body.name;	
	this.local.email = req.body.email;

	if (signup || req.body.password && req.body.password!="")
	{
		this.local.password = req.body.password;
	}
	return this.validateForm(req, res, signup);
}

userSchema.methods.validateForm = function(req, res, signup){
	var errors = [];
	
    if(signup && (req.body.terms == undefined || !req.body.terms) ) {
		//errors.push("###accept### ###terms###");
	}
	if (signup && req.body.password && req.body.password=="")
	{
		errors.push("###required###: ###password###");
	}
	if (req.body.password && req.body.password!="")
	{
		if (req.body.password != req.body.passwordcheck)
		{
			errors.push("###passwordmustmatch###");
		}
		
		if (req.body.password.length < 6)
		{
			errors.push("###passwordtooshort###");
		}
		
		var passwordregex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/;
		if (passwordregex.test(req.body.password)==false)
		{
			errors.push("###passwordtooweak###");
		}	
	}
	
	if (!this.name || this.name==null || this.name=="")
	{
		errors.push("###required###: ###name###");
	}
	
	if (!this.email || this.email==null || this.email=="")
	{
		errors.push("###required###: ###email###");
	}
	else
	{
		var emailregex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
		if (this.email.length < 3 || emailregex.test(this.email)==false)
		{
			errors.push("###email### ###invalid###");
		}
	}

	return errors;
}




// create the model for users and expose it to our app
/*userSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});*/
module.exports=mongoose.model('User',userSchema) ;