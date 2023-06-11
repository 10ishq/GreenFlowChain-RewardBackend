const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/productModel");
const { getFlowBalance, sendFlow } = require("./FCL");
const priceFeedModel = require("./models/priceFeedModel");
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/addProduct", async (req, res) => {
  const { productHash, rewardAmount } = req.query;

  try {
    const product = await Product.create({
      productHash,
      rewardAmount,
    });
    res.status(201).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: "Failed to add the product",
    });
  }
});

app.get("/checkProduct", async (req, res) => {
  const { productHash } = req.query;

  try {
    const product = await Product.findOne({ productHash });
    if (!product) {
      res.status(404).json({
        status: "fail",
        message: "Product not found in the database",
      });
      return;
    }

    if (product.redeemed) {
      res.status(400).json({
        status: "fail",
        message: "Product already redeemed",
      });
      return;
    }

    res.status(200).send(productHash)
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

app.get("/redeemReward", async (req, res) => {
  const { productHash, flowAddress } = req.query;

  try {
    const product = await Product.findOne({ productHash });
    if (!product) {
      res.status(404).json({
        status: "fail",
        message: "Product not found in the database",
      });
      return;
    }

    if (product.redeemed) {
      res.status(400).json({
        status: "fail",
        message: "Product already redeemed",
      });
      return;
    }

    const rewardAmount = product.rewardAmount;

    try {
      const priceFeed = await priceFeedModel.findOne({}).sort({ timestamp: -1 });
      const price = 1 / (priceFeed.price / 100000000);
      console.log("price", price);

      if (getFlowBalance(process.env.ADMIN_ADDRESS) < price) {
        res.status(400).json({
          status: "fail",
          message: "Insufficient balance",
        });
        return;
      }

      await sendFlow(flowAddress, rewardAmount);
      product.redeemed = true;
      await product.save();

      res.status(200).json({
        status: "success",
        message: "Reward redeemed successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

mongoose
  .connect("mongodb+srv://reflowchain:reflowchain@reflowchain.r4hxsjs.mongodb.net/products?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.error("Connection to the database failed:", err);
  });
