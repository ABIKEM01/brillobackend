import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import handlebars from "handlebars";
import fs from "fs";
import generateToken from "../utils/generateToken.js";
import User from "../models/usersModel.js";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import path from "path";

//forgotpassword template
const emailTemplate = fs.readFileSync(
  path.join(__dirname, "../templates/forgot.handlebars"),
  "utf-8"
);
const template = handlebars.compile(emailTemplate);

//account verification template
const verifyEmailTemplate = fs.readFileSync(
  path.join(__dirname, "../templates/emailVerification.handlebars"),
  "utf-8"
);
const verifytemplate = handlebars.compile(verifyEmailTemplate);
//@desc: create user
//route: POST /api/v1/users/register
//access: public

const createUser = async (req, res) => {
  const { username, email, phone,interests_id } = req.body;

  //check if user does not exist
  const existingUser = await User.findOne({ email });

  console.log("existing user", existingUser);
  if (existingUser) {
    return res.status(400).json({ message: "User with email already exists" });
  }

  // Generate verification code
  const verificationCode = otpGenerator.generate(4, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });
  // const link = `https://cityshoppa-lemon.vercel.app/reset-password?id=${user.email}&token=${verificationCode}`;
  // const link = `https://cityshoppa-lemon.vercel.app/reset-password?token=${verificationCode}`;
  const link = `https://brilloapis.onrender.com/api/v1/users/verify?code=${verificationCode}`;

  console.log("verificationcode", verificationCode);
  const messageBody = verifytemplate({
    link: link,
    email: req.body.username,
    verificationCode: verificationCode,
  });
  // Send verification email
  // const msg = {
  //   to: email,
  //   from: "babayodea10@gmail.com",
  //   subject: "Verify Your Email Address",
  //   text: `Please click the following link to verify your email address: http://yourwebsite.com/verify/${verificationCode}`,
  // };
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const msg = {
    to: req.body.email,
    from: "babayodea10@gmail.com",
    subject: "Verify your account",
    html: messageBody,
  };
  try {
    await sgMail.send(msg);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      verificationCode,
      interests_id
      // role: "admin",
    });
    res.status(200).json({
      status: "success",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        verificationCode: user.verificationCode,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "fail",
      error: err.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { code,id } = req.params;

    // Find user by verification code
    const user = await User.findOne({ verificationCode: code });
    // const user = await User.findById(id);
    console.log("code",user)
    // console.log("verificationCode",verificationCode)

    if (user) {
      user.isVerified = true;
      await user.save();
      return res.status(200).send('Email verification successful!');
    } else {
      return res.status(400).send('Invalid verification code.');
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).send('Internal server error.');
  }
};


//@desc: get all users
//route: GET /api/v1/users
//access: private - admin only
const getUsers = async (req, res) => {
  // res.send('get all users')
  try {
    const user = await User.find({}, "-password");
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      error: err.message,
    });
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, "-password").populate("interests_id")

    res.status(200).json({
      status: `User successfully  find`,
      user,
    });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

//@desc: login users
//route: POST /api/v1/users/register
//access: public
const loginUser = async (req, res) => {
  const { email, password, phone } = req.body;
  // console.log(email, password, phone);

  try {
    let user;
    // Check if the login input is an email or phone number
    if (email) {
      // Check if email exists
      user = await User.findOne({ email: email });
    } else if (phone) {
      // Check if phone number exists
      user = await User.findOne({ phone: phone });
    } else {
      res.status(401);
      throw new Error("Email or phone number is required");
    }

    if (!user) {
      res.status(401);
      throw new Error("User does not exist, please register");
    }

    if (user && (await user.passwordMatched(password))) {
      res.status(200).json({
        status: "success",
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          phone: user.phone,
          role: user.role,
          interests_id: user.interests_id,
          token: await generateToken(user._id),
        },
      });
    } else {
      res.status(402);
      throw new Error("Invalid email or password");
    }
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "failed",
      error: err.message,
    });
  }
};


const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, phone, email } = req.body;

  try {
    const user = await User.findById({ _id: id });

    if (!user) {
      res.status(400).json({
        msg: "No user found",
      });
    }
    if (username) {
      user.username = username;
    }
    if (email) {
      user.email = email;
    }
    if (phone) {
      user.phone = phone;
    }
    await user.save();
    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      error: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password, newPassword } = req.body;

  // Validate if user is alredy in database
  const user = await User.findOne({ _id: id });
  if (!user) return res.status(400).send("User doesn't exist");

  try {
    const verify = jwt.verify(token, process.env.JWTSECRET);
    // validate if password 1 and password 2 MATCH -> NOT YET

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    const updatedUser = await user.save();
    res.send("Password reset successfully");
    // bcrypt.genSalt(saltRounds, (err, salt) => {
    //   if (err) return res.json(err);
    //   bcrypt.hash(password2, salt, async (err, hash) => {
    //     user.password = hash;
    //     await user.save();
    //     res.send("Password is updated!");
    //   });
    // });
  } catch (err) {
    res.status(400).json(err);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body.email;

    //check if user is alredy in database
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send("User doesn't exist");

    // create token
    const token = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWTSECRET,
      {
        expiresIn: "15m",
      }
    );
    // console.log("forgotToken", token);

    // generate resetUrl link using the token and id
    // const link = `https://cityshoppa.onrender.com/api/v1/users/resetpassword/${user._id}/${token}`;
    const link = `https://cityshoppa-lemon.vercel.app/reset-password?id=${user._id}&token=${token}`;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const messageBody = template({
      link: link,
      email: req.body.email,
    });

    const msg = {
      to: req.body.email,
      from: "babayodea10@gmail.com",
      subject: "Forgot Password",
      html: messageBody,
    };
    sgMail.send(msg).then(() => {
      console.log("email sent successfully");
      res.status(200).json({
        status: "success",
        message:
          "password reset link has been sent to the email You provided. The link expired in 15 minutes",
      });
    });

    // SEND EMAIL
    user.updateOne({ resetLink: token });
  } catch (err) {
    res.status(400).json(err);
  }
};

export {
  getUsers,
  getUser,
  createUser,
  loginUser,
  updateUser,
  resetPassword,
  forgotPassword,
  verifyEmail,
};
