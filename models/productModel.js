const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  productHash: { type: String, required: [true, "Please enter Product Hash"] },
  rewardAmount: {
    type: String,
    required: [false, "Please enter Reward Amount"],
  },
  redeemed:{
    type: Boolean,
    default: false
  }
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;