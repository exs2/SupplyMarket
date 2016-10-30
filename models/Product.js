var mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imagePath: String,
  seller: {type: Number, ref: 'User'},
  amount: Number,
  productionPeriod: {type: String, default: 'OneTime'}
});

ProductSchema.methods.buy = function(buyer, amount, callBack){
  if(this.amount >= amount){
    this.amount -= amount;
  }
  else{
    callBack('not enough product in stock');
  }
}

var Product = mongoose.model('Product', ProductSchema);
module.exports = Product;