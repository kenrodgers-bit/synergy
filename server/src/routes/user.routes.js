const express = require("express");

const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");

const router = express.Router();

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt
  };
}

router.use(authenticate);

router.get(
  "/",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const users = await User.find().select("-password").sort({ name: 1 });
    return res.json(users.map(serializeUser));
  })
);

router.post(
  "/",
  authorize("super-admin"),
  asyncRoute(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "collection-agent");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber: req.body.phoneNumber || ""
    });

    return res.status(201).json(serializeUser(user));
  })
);

router.put(
  "/:id",
  authorize("super-admin"),
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    ["name", "email", "phoneNumber", "role"].forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();
    return res.json(serializeUser(user));
  })
);

router.delete(
  "/:id",
  authorize("super-admin"),
  asyncRoute(async (req, res) => {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "User deleted." });
  })
);

module.exports = router;

