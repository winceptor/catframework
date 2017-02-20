// models/user.js
// load the things we need
var mongoose =require('mongoose');
var mongoosastic = require('mongoosastic');
var bcrypt   = require('bcrypt-nodejs');

var Schema= mongoose.Schema;

// define the schema for our user model
var userSchema = Schema({

    local            : {
        email        : String,
        password     : String,
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

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
/*userSchema.plugin(mongoosastic,{
  hosts:[
    'localhost:9200'
  ]
});*/
module.exports=mongoose.model('User',userSchema) ;