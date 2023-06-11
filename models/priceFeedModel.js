const mongoose = require('mongoose');

const priceFeedSchema = new mongoose.Schema({
    price: { type: Number, required: true },
    timestamp: { type: Number, required: true },
});

const PriceFeed = mongoose.model('PriceFeed', priceFeedSchema);
module.exports = PriceFeed;