var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var fs = require('fs-extra');
var multer = require('multer');
var avatarDirectory = './public/images/';
var upload = multer({ dest: './temp/images/'});
var jwt = require('express-jwt');
var config = require('../config');
var auth = jwt({secret: config.secret});

var adminCheck = function(req, res, next){
  if(!req.user.admin){
    return res.status(403).json({message: 'You have no permission to access this page'});
  }
  next();
}

var allRequiredUserInfoPresentCheck = function(req, res, next){
  if(!req.body.user || !req.body.password){
    return res.status(400).json({message: 'Please input all required fields'});
  }
  next();
}

var accessOwnProfileCheck = function(req, res, next){
  if(req.params.username !== req.user.username){
    return res.status(403).json({message: 'You have no permission to access this page'});
  }
  next();
}

var handleUploadedAvatar = function(userId, file, callBack){
  if(!userId || !file){ 
    callBack(new Error('userId or file is invalid')); 
  }
  var source = file.path;
  var dest = avatarDirectory + userId + file.originalname.match(/\..+$/);
  console.log('source: ' + source);
  console.log('dest: ' + dest);
  fs.copy(source, dest, function(err){
    if(err){
      console.log('copy file error');
    }
    callBack(null, dest);
  });
}

router.get('/', auth, adminCheck, function(req, res, next){
  //TODO: List all users
});

router.get('/register', function(req, res, next){
  //TODO: Render login page
});

router.post('/register', upload.single('avatar'), allRequiredUserInfoPresentCheck, function(req, res, next){
  var user = new User(req.body);
  user.setPassword(req.body.password); //Hasing before store to db
  handleUploadedAvatar(user._id, req.file, function(err, savedPath){
    if(err){ 
      console.log('upload error');
      next(err); 
    }
    
    user.avatarPath = savedPath;
    
    user.save(function(err){
      if(err){
        console.log('save to db error');
        next(err);
      }
      
      res.json({message: 'User created', token: user.generateJWT()});
    });
  });
});

router.get('/login', allRequiredUserInfoPresentCheck, function(req, res, next){
  //TODO: Render login page
});

router.post('/login', allRequiredUserInfoPresentCheck, function(req, res, next){
  User.findOne({username: req.body.username}, function(err, user){
    if(err){
      console.log('user not found');
      next(err);
    }
    
    if(!user.validatePassword(req.body.password)){
      return res.status(401).json({message: 'Invalid password'});
    }
    
    return res.json({message: 'Login success', token: user.generateJWT()});
  });
});

router.get('/:username', auth, function(req, res, next){
  //TODO: render profile page
  User.findOne({username: req.params.username }, function(err, user){
    if(err){
      console.log('user not found');
      next(err);
    }
    
    res.json(user);
  })
});

router.put('/:username', auth, upload.single('avatar'), accessOwnProfileCheck, function(req, res, next){
  User.findOne({username: req.params.username}, function(err, user){
    if(err){
      console.log('user not found');
      next(err);
    }
    
    if(req.body.oldPassword && req.body.newPassword){
      if(!user.validatePassword(req.body.oldPassword)){
        return res.status(400).json({message: 'Current password is incorrect'});
      }
      user.setPassword(req.body.newPassword);
    }
    
    fs.remove(user.avatarPath, function(err){
      if(err){ console.log('Cannot delete file: ' + user.avatarPath); }
    });
    
    handleUploadedAvatar(user._id, req.file, function(err, savedPath){
      if(err){ 
        console.log('upload error');
        next(err); 
      }

      user.avatarPath = savedPath;
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;
      user.address = req.body.address;
      
      user.save(function(err){
        if(err){
          console.log('save to db error');
          next(err);
        }

        res.json({message: 'User profile updated', token: user.generateJWT()});
      });
    });
  });
});

module.exports = router;