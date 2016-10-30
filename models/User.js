var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config');

var UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: {type: String, unique: true},
  passwordHash: String,
  salt: String,
  address: String,
  avatarPath: String,
  sellingProducts: [{type: Number, ref: 'Product'}],
  productInCarts: [{type: Number, ref: 'ProductInCart'}],
  concurrentTransactions: [{type: Number, ref: 'ConcurrentTransaction'}]
});

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
}

UserSchema.methods.validatePassword = function(password){
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
  
  return this.hash === hash;
}

UserSchema.methods.generateJWT = function(){
  
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 7); // set expiration to 7 days
  
  var token = jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, config.secret);
  
  return token;
}

UserSchema.methods.checkOut = function(callBack){
  this.productInCarts.forEach(function(productInCart){
    productInCart.buy(function(err){
      if(err){ 
        console.log('cannot buy ' + productInCart.product.name + ': ' + err);
        callBack(err);
        return;
      }
      console.log(productInCart.product.name + ' bought!');
    });
  });
}

UserSchema.methods.addToCart = function(product, amount, callBack){
  if(product.amount >= amount){
    this.productInCarts.push(new ProductInCart({product: product, amount: amount}));
  }
  else{
    callBack('not enough product in stock');
  }
}

var User = mongoose.model('User', UserSchema);
module.exports = User;