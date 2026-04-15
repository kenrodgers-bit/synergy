const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role
  };
}

router.post(
  "/login",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      token: signToken(user),
      user: serializeUser(user)
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncRoute(async (req, res) => {
    return res.json({ user: serializeUser(req.user) });
  })
);

module.exports = router;

