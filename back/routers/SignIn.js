require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const signInRouter = express.Router();
const bcrypt = require("bcrypt"); // For password hashing and comparing
const Managers = require("../models/Managers"); // User model from MongoDB
const crypto = require("crypto"); // For generating random numbers (for password reset code)
const nodemailer = require("nodemailer"); // For sending emails (password reset code)
const _ = require('lodash'); // Utility library (if needed)
const jwt = require("jsonwebtoken"); // For generating JWT tokens
const authMiddlewareProv = require("../authMiddlewareProv"); // Middleware to handle provisional tokens

let randomNumber; // Will hold the randomly generated code for password reset

// Route to handle user sign-in
signInRouter.post("/", async (req, res) => {
  try {
    // Find user by email
    console.log(req.body)
    const user = await Managers.findOne({ email: req.body.email });
    if (!user) {
        console.log("No account is associated with this email");
        return res.status(400).send({ "response": "No account is associated with this email" });
    }

    // Check if the provided password matches the stored hashed password
    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatch) {
        console.log("Incorrect password");
        return res.status(400).send({ "response": "Incorrect password" });
    }

    // Generate a JWT token upon successful login
    const token = jwt.sign({ user }, process.env.SECRET, { expiresIn: "7d" });
    console.log(token)
    res.status(200).send({ "response": "success", "token" : token, "role" : user.role });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error during sign-in");
  }
});

// Route to initiate forgot password process
signInRouter.post("/forgotPassword", async (req, res) => {
  try {
    // Check if the user exists by email
    const user = await Managers.findOne({ email: { $eq: req.body.email } });
    console.log(user);
    
    if (user == null) {
      res.status(400).send({ "response": "No account is associated with this email" });
    } else {
      // Create a provisional token that expires in 10 minutes
      const token_provisoir = jwt.sign({ user }, process.env.SECRET_PROVISOIR, { expiresIn: "10m" });

      // Generate a random 5-digit number for password reset
      const randomBytes = crypto.randomBytes(2);
      randomNumber = (randomBytes.readUInt16BE(0) % 90000) + 10000;
      console.log(randomNumber);

      // Set up nodemailer to send the password reset code via email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'dihiadahdah@gmail.com',
          pass: 'deyexszhixwjwigq' // It's recommended to store this in an environment variable
        }
      });

      // Define email options
      const mailOptions = {
        from: 'dihiadahdah@gmail.com',
        to: req.body.email,
        subject: `Reset Code`,
        text: "Your confirmation code is " + randomNumber
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          res.status(500).send("Error sending confirmation code");
        } else {
          console.log('Email sent: ' + info.response);
          res.status(200).json([{ "message": "success" }, token_provisoir]);
          console.log("Provisional token: ", token_provisoir);
        }
      });
    }
  } catch (err) {
    console.log("Error sending code");
    res.status(500).send("Error sending code");
  }
});

// Route to verify the reset code
signInRouter.post("/forgotPassword/code", authMiddlewareProv, async (req, res) => {
  try {
    console.log(randomNumber);
    // Check if the provided code matches the generated randomNumber
    if (req.body.code == randomNumber) {
      console.log("Correct code");
      res.status(200).send({ "response": "Correct code" });
    } else {
      console.log("Incorrect code provided");
      res.status(400).send({ "response": "Incorrect code provided" });
    }
  } catch (err) {
    console.log("Error verifying code");
    res.status(500).send("Error verifying code");
  }
});

// Route to update the user's password after code verification
signInRouter.post("/forgotPassword/new", authMiddlewareProv, async (req, res) => {
  try {
    // Ensure the two passwords match
    if (req.body.password != req.body.confirmPassword) {
      console.log("Passwords do not match");
      return res.status(400).send({ "response": "Passwords do not match" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(hashedPassword);

    // Update the password in the database
    await Managers.updateOne({ email: req.user.email }, { $set: { password: hashedPassword } });
    res.status(200).send({ "response": "Password successfully changed" });
  } catch (err) {
    console.log("Error resetting password");
    res.status(500).send({ "response": "Error resetting password" });
  }
});

// Route to generate a hashed password (for testing purposes)
signInRouter.post("/generateCrypt", async (req, res) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  console.log(hashedPassword);
  res.status(200);
});

// Route to resend the reset code
signInRouter.post("/forgotPassword/repeat", authMiddlewareProv, async (req, res) => {
  try {
    // Generate a new random code
    const randomBytes = crypto.randomBytes(2);
    randomNumber = (randomBytes.readUInt16BE(0) % 90000) + 10000;
    console.log(randomNumber);

    // Set up nodemailer to resend the password reset code
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dihiadahdah@gmail.com',
        pass: 'deyexszhixwjwigq' // It's recommended to store this in an environment variable
      }
    });

    // Define email options
    const mailOptions = {
      from: 'dihiadahdah@gmail.com',
      to: req.user.email,
      subject: `Reset Code`,
      text: "Your confirmation code is " + randomNumber
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error resending confirmation code");
      } else {
        console.log('Email sent: ' + info.response);
        res.status(200).json({ "message": "success" });
      }
    });
  } catch (err) {
    console.log("Error resending code");
    res.status(500).send("Error resending code");
  }
});







module.exports = signInRouter;