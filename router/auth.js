const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { json } = require("express");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const PaytmChecksum = require("../PaytmChecksum");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

require("../db/conn");
const User = require("../models/userSchema");
const Contact = require("../models/contactSchema");
const RestaurantNewUser = require("../models/userSchemaAD");
const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const Authenticate = require("../authentification/Middleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueFileName = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  },
});

const upload = multer({ storage });

//payment route

router.post("/uploadfile", upload.single("file"), (req, res) => {
  return res.json({ file: req.file });
});

router.post("/payment", (req, res) => {
  const { amount, email } = req.body;

  /* import checksum generation utility */
  const PaytmChecksum = require("./PaytmChecksum");

  const totalAmount = JSON.stringify(amount);

  const paytmParams = {};

  /* initialize an array */

  (params["MID"] = process.env.PAYTM_MID),
    (params["WEBSITE"] = process.env.PAYTM_WEBSITE),
    (params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID),
    (params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE_ID),
    (params["ORDER_ID"] = uuidv4()),
    (params["CUSTOM_ID"] = process.env.PAYTM_CUSTOM_ID),
    (params["TXN_AMOUNT"] = totalAmount),
    (params["CALLBACK_URL"] = "http://localhost:4457/api/callback"),
    (params["EMAIL"] = email),
    (params["MOBILE_NUMBER"] = "9373078258");

  /**
   * Generate checksum by parameters we have
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  const paytmChecksum = PaytmChecksum.generateSignature(
    paytmParams,
    PAYTM_MERCHANT_KEY
  );
  paytmChecksum
    .then(function (checksum) {
      let paytmParams = {
        ...params,
        CHECKSUMHASH: checksum,
      };
      res.json(paytmParams);
    })
    .catch(function (error) {
      console.log(error);
    });
});

//razor pay
//key_id=rzp_test_gYyWEU6sKcZ2Lk
//key_secret=MIpahjXbOnsF1F7BgDjDpnSN

router.post("/razorPayment", (req, res) => {
  const instance = new Razorpay({
    key_id: "rzp_test_gYyWEU6sKcZ2Lk",
    key_secret: "MIpahjXbOnsF1F7BgDjDpnSN",
  });
  const options = { amount: 100, currency: "INR", receipt: "order_rcptid_11" };
  instance.orders.create(options, function (err, order) {
    console.log(order);
    res.json(order);
  });
});

//product route

router.post("/addnewproduct", async (req, res) => {
  const { name, price, quentity, type, file, restaurantID } = req.body;

  if (!name || !price || !quentity || !type || !restaurantID) {
    return res.status(422).json({ message: "ERROR" });
  }

  try {
    const productExist = await Product.findOne({ name: name });

    if (productExist) {
      return res.status(400).json({ message: "User already exist !!" });
    } else {
      const product = new Product({
        name,
        price,
        quentity,
        type,
        file,
        restaurantID,
      });

      await product.save();
      return res.status(201).json({ message: "Product added successfully !!" });
    }
  } catch (error) {
    console.log(error);
  }
});

//registration route

router.post("/register", async (req, res) => {
  const { name, email, phone, password, cpassword } = req.body;

  if (!name || !email || !phone || !password || !cpassword) {
    return res.status(422).json({ message: "Unexpected error occured !!" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(422).json({ message: "User already exist !!" });
    } else if (password != cpassword) {
      return res.status(422).json({ message: "Password are not matching !!" });
    } else {
      const user = new User({ name, email, phone, password, cpassword });

      //data mongodb la save karya aadhi password secure kela aahe userSchama madhe by using bcryptjs

      await user.save();
      return res
        .status(201)
        .json({ message: "User registerd successfully !!" });
    }
  } catch (error) {
    console.log(error);
  }
});

//contact route

router.post("/contact", async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email || !phone || !address) {
    return res.status(400).json({ message: "Some Error Occured" });
  }

  try {
    const contact = new Contact({ name, email, phone, address });

    await contact.save();
    return res.status(201).json({ message: "Success !!" });
  } catch (error) {
    return res.status(401).json(error);
  }
});

//Adding new restaurant route

router.post("/addrestaurant", async (req, res) => {
  const { name, email, phone, items, address, file } = req.body;

  if (items <= 10) {
    return res
      .status(422)
      .json({ message: "Sorry please try with more than 10 items !!!" });
  }

  if (!name || !email || !phone || !items || !address || !file) {
    return res.status(422).json({ message: "Unexpected error occure !!" });
  }

  try {
    const userExist = await User.findOne({ email: email });

    if (userExist) {
      const restaurantnewuser = new RestaurantNewUser({
        name,
        email,
        phone,
        items,
        address,
        file,
      });
      await restaurantnewuser.save();

      return res
        .status(201)
        .json({ message: "Restaurant Added Successfully !!" });
    } else {
      return res.status(422).json({ message: "Please register first !!" });
    }
  } catch (error) {
    console.log(error);
  }
});

//signIn route

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Invalid Credentials !" });
    }

    const userLogin = await User.findOne({ email: email });
    const adminLogin = await User.findOne({ email: email, isadmin: true });
    const reststaurantUser = await RestaurantNewUser.findOne({ email: email });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      const token = await userLogin.generateAuthToken();
      // const refreshtoken = await userLogin.generateAuthToken();

      res.cookie("jwttoken", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        httpOnly: true,
      });

      if (reststaurantUser) {
        return res.status(202).json({ reststaurantUser });
      }

      if (adminLogin) {
        return res.status(201).json({ message: "success" });
      }
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials !" });
      } else {
        return res.status(200).json({ userLogin });
      }
    } else {
      return res.status(400).json({ message: "Invalid Credentials !" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to signIn !!" });
  }
});

router.get("/refreshtoken", async (req, res) => {
  const { jwttoken } = req.cookies;

  if (!jwttoken) {
    return res.status(401).json({ message: "ERROR" });
  }

  try {
    const tokenData = jwt.verify(jwttoken, process.env.SECRET_KEY);

    const user = await User.findOne({ _id: tokenData._id });

    if (!user) {
      return res.status(400).json({ message: "ERROR" });
    }
    const token = await userLogin.generateAuthToken();

    res.cookie("jwttoken", token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      httpOnly: true,
    });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(401).json({ message: "ERROR" });
  }
});

router.post("/cart", async (req, res) => {
  const { UserAddress, UserID, totalPrice, restaurantID } = req.body;
  console.log(req.body);

  if (!UserAddress || !UserID || !totalPrice || !restaurantID) {
    return res.status(422).json({ message: "Unexpected error occured !!" });
  }

  try {
    const order = new Cart({ UserAddress, UserID, totalPrice, restaurantID });

    //data mongodb la save karya aadhi password secure kela aahe userSchama madhe by using bcryptjs

    await order.save();
    return res.status(201).json({ message: "Order Taken successfully !!" });
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/get/about", Authenticate, async (req, res, error) => {
  console.log(error);
  res.json(req.rootUser);
});

router.get("/get/UserDetails", Authenticate, async (req, res) => {
  const Users = await User.find();
  return res.json(Users);
});

router.post("/updateuserdetails/:id", async (req, res) => {
  let { name, email, phone, password, cpassword } = req.body;
  console.log(req.body);

  password = await bcrypt.hash(password, 12);
  cpassword = await bcrypt.hash(cpassword, 12);

  const updateUserDetails = await User.findOneAndUpdate(
    { _id: req.params.id },
    {
      name: name,
      email: email,
      phone: phone,
      password: password,
      cpassword: cpassword,
    }
  );
  return res.status(200).json(updateUserDetails);
});

router.post("/updateStatus/:id", async (req, res) => {
  const { updateStatus, reason } = req.body;

  const update = await Cart.findOneAndUpdate(
    { _id: req.params.id },
    { orderStatus: updateStatus, reason: reason }
  );
  return res.status(200).json(update);
});

router.get("/get/userOrders/:id", async (req, res) => {
  const Orders = await Cart.find({ UserID: req.params.id }).populate(
    "restaurantID"
  );
  return res.json(Orders);
});

router.get("/get/cartOrders/:id", async (req, res) => {
  const getCartOrders = await Cart.find({ restaurantID: req.params.id });
  return res.json(getCartOrders);
});

router.get("/get/userOrederDetails/:id", async (req, res) => {
  const getUser = await User.findOne({ _id: req.params.id });
  return res.json(getUser);
});

router.get("/get/allrestaurants", async (req, res) => {
  const restaurants = await RestaurantNewUser.find();
  return res.json(restaurants);
});

//route to get all products of specific user

router.get("/get/cartproducts/:id", async (req, res) => {
  const cartproduct = await Cart.find({ _id: req.params.id });
  return res.json(cartproduct);
});

router.get("/get/allproducts/:id", async (req, res) => {
  const products = await Product.find({ restaurantID: req.params.id });
  return res.json(products);
});

router.delete("/updateproduct/:id", async (req, res) => {
  const { id } = req.params;
  const products = await Product.findOneAndDelete({ _id: req.params.id });
  return res.json(products);
});

router.delete("/deleteUserOne/:id", async (req, res) => {
  const { id } = req.params;
  const data = await User.findOneAndDelete({ _id: req.params.id });
  return res.json(data);
});

router.put("/updateproduct/:id", async (req, res) => {
  const { id } = req.params;
  const products = await Product.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body }
  );
  return res.json(products);
});

router.get("/updateproduct/:id", async (req, res) => {
  const { id } = req.params;
  const products = await Product.findOne({ _id: req.params.id });
  return res.json(products);
});

router.get("/get/restaurant/:id", async (req, res) => {
  const restaurants = await RestaurantNewUser.findOne({ _id: req.params.id });
  return res.json(restaurants);
});

router.get("/get/product/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id });
  return res.json(product);
});

router.delete("/deleteContact/:id", async (req, res) => {
  const contact = await Contact.findByIdAndDelete({ _id: req.params.id });
  return res.json(contact);
});

router.get("/get/info/restaurant/:id", async (req, res) => {
  const restaurantInfo = await RestaurantNewUser.findOne({
    _id: req.params.id,
  });
  return res.json(restaurantInfo);
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwttoken", { path: "/" });
  res.status(200).json("User logout");
});

//sending email verification code
router.post("/emailSend", async (req, res) => {
  const { email } = req.body;
  let data = await User.findOne({ email: req.body.email });

  const responceType = {};

  if (data) {
    let otpcode = Math.floor(Math.random() * 10000 + 1);
    responceType.statusText = "Success";
    responceType.message = "Please check Your Email Id";

    /////////////////////////////////////////////////////////////////

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "jaradomkar1@gmail.com",
        pass: "1234@1234",
      },
    });

    const mailOptions = {
      from: "jaradomkar1@gmail.com",
      to: req.body.email,
      subject: "One time verification OTP from BISTRO",
      text: otpcode.toString(),
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    let final__otp = otpcode.toString();
    res.status(200).json({ email, final__otp });

    //////////////////////////////////////////////////////////////////
  } else {
    responceType.statusText = "error";
    responceType.message = "Email Id not Exist";
  }
});

router.post("/changePassword", async (req, res) => {
  let { otp, otpcode, email, password, cpassword } = req.body;
  let data = await User.findOne({ email: email });

  const responce = {};
  if (data && otp === otpcode) {
    let currentTime = new Date().getTime();
    let diff = data.expireIn - currentTime;

    if (diff < 0) {
      responce.message = "Token Expire";
      responce.statusText = "error";
      res.status(402).json(responce);
    } else {
      let user = await User.findOne({ email: email });
      user.password = password;
      user.cpassword = cpassword;

      password = await bcrypt.hash(user.password, 12);
      cpassword = await bcrypt.hash(user.cpassword, 12);
      user.save();
      responce.message = "Password changed Successfully";
      responce.statusText = "Success";
      res.status(200).json(responce);
    }
  } else {
    responce.message = "Invalid Otp";
    responce.statusText = "error";
    res.status(401).json(responce);
  }
});

router.get("/get/contactDetails", async (req, res) => {
  const Contacts = await Contact.find();
  return res.json(Contacts);
});

//sending email verification code fro register route
router.post("/emailSendforverification", async (req, res) => {
  const { email } = req.body;
  console.log(req.body);
  let data = await User.findOne({ email: email });

  const responceType = {};

  if (!data) {
    let otpcode = Math.floor(Math.random() * 10000 + 1);
    responceType.statusText = "Success";
    responceType.message = "Please check Your Email Id";

    /////////////////////////////////////////////////////////////////

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "jaradomkar1@gmail.com",
        pass: "1234@1234",
      },
    });

    const mailOptions = {
      from: "jaradomkar1@gmail.com",
      to: req.body.email,
      subject: "One time verification OTP from BISTRO",
      text: otpcode.toString(),
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    let final__otp = otpcode.toString();
    res.status(200).json({ email, final__otp });
    console.log({ email, final__otp });

    //////////////////////////////////////////////////////////////////
  } else {
    return res.status(401).json({ message: "ERROR" });
  }
});

router.post("/emailVerification", async (req, res) => {
  let { otp, otpcode, email } = req.body;
  let data = await User.findOne({ email: email });

  const responce = {};
  if (!data && otp === otpcode) {
    let currentTime = new Date().getTime();
    let diff = currentTime * 60 * 30 - currentTime;

    if (diff < 0) {
      responce.message = "Token Expire";
      responce.statusText = "error";
      res.status(402).json(responce);
    } else {
      res.status(200).json(responce);
    }
  } else {
    responce.message = "Invalid Otp";
    responce.statusText = "error";
    res.status(401).json(responce);
  }
});

module.exports = router;
