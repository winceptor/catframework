var router = require('express').Router();

var User = require('../models/user');


var socketsinit = function(io) {
    var sockets = [];


    function randomhash() {
      return Math.random().toString(36).substring(3,16) + +new Date;
    }

    function broadcast(event, data) {
      sockets.forEach(function (socket) {
        socket.emit(event, data);
        //console.log(socket.user_id + ": " + event + " - " + data);
      });
    }
    
    function usercast(user_id, event, data) {
      sockets.forEach(function (socket) {
          if (socket.user_id && user_id && socket.user_id.equals(user_id)) {
            socket.emit(event, data);
          }
        //console.log(socket.user_id + ": " + event + " - " + data);
      });
    }
   
    io.on('connection', function (socket) {
        
        //console.log("received connection"); 
        sockets.push(socket);  
        
        //broadcast("connections", sockets.length);
        
        socket.on('disconnect', function () {
            //console.log("lost connection"); 
            sockets.splice(sockets.indexOf(socket), 1);
            broadcast("connections", sockets.length);
        });
        
        
        socket.on('identify', function (data) {
            var socket_user = data.socket_user;
            var socket_hash = data.socket_hash;
            //console.log(socket_user + " - " + socket_hash);
            if (socket_user && socket_hash && socket_user.length>0 && socket_hash.length>0 ) {
                User.findOne({'local.email':socket_user, socket_hash: socket_hash}).exec(function(err, user) {
            		if(err) return console.log(err);
                    if (user && user.socket_hash && user.socket_hash.length>0){
                       
                	    
            			var userdata = {};
            			userdata.user_id = user._id;
            			userdata.socket_user = user.local.email;
            			userdata.socket_hash = user.socket_hash;
            			
                        socket.user_id = user._id;
                        
                        //socket.userdata = userdata;
                        //socket.user = user;
                        
                        //console.log("Identified socket as: " + user.local.email);
                        
                        user.socket_hash = null;
                        user.save(function(err, updatedUser) {
            				if(err) return console.log(err);
            				//res.locals.socket_hash = socket_hash;
            			});  
            			
                        socket.emit('identified', userdata);
                        return true;
                    }
                    else
                    {
                        //console.log("Identified socket as: (unknown)");
                	    socket.emit('identified', false);
                    }
            	});
                
            }
            else
            {
                //console.log("Identified socket as: (visitor)");
        	    socket.emit('identified', false);
            }
            
        });
        
    });
    
    
    router.use(function(req, res, next) {
        var socket_hash = randomhash();
        res.locals.socket_hash = socket_hash;
        //console.log("socket_hash: " + socket_hash);
        
        if (req.user)
        {
            User.findById({_id:req.user._id}).exec(function(err, user) {
        		if(err) return next(err);
        		if (!user)
        		{
        			console.log("error null user");
        			return next();
        		}
                user.socket_hash = socket_hash;
        	    user.save(function(err, updatedUser) {
    				if(err) return next(err);
    				//res.locals.socket_hash = socket_hash;
    			});    
        	});
        }
        next();
    });
    
        
    router.use(function(req, res, next) {
        req.socket_emit = function(user_id, handle, data) {
            //var socket = usere(user_id);
            //if (socket) {
            //    //console.log("usersocket error");
            //    socket.emit(handle, data);
            //}
            
            usercast(user_id, handle, data);
        };
        
        req.socket_broadcast = function(handle, data) {
            broadcast(handle, data);
        };
        next();
    });
    
    router.get('/testsockets', function(req, res, next) {
        //var connections = sockets.length;
        res.resultmessage("info", "Sockets: " + sockets);
    });
    
    return router;
}

//returns router
module.exports= socketsinit;