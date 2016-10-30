var mongoose = require('mongoose');

var ProductInCartSchema = new mongoose.Schema({
  product: {type: Number, ref: 'Product'},
  amount: Number
});

var ProductInCart = mongoose.model('ProductInCart', ProductInCartSchema);
module.exports = ProductInCart;