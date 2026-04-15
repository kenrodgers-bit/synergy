const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Authentication failed." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission for this action." });
    }

    return next();
  };
}

module.exports = { authenticate, authorize };

