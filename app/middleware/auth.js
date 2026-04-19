const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifySecretAndToken = async (req, res, next) => {
  try {
    // We allow public access without token/secret for read-only published blogs.
    // So if no header is present, we set req.user to null and continue.
    const secretKey = req.headers["x-secret-key"];
    let token = req.headers.authorization;

    if (!secretKey && !token) {
      req.user = null; // Public user
      return next();
    }

    if (!secretKey || secretKey !== process.env.SECRET_KEY) {
      return res.status(403).json({ success: false, message: "Invalid or missing secret key" });
    }

    if (!token || !token.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Invalid or missing auth token" });
    }

    token = token.split(" ")[1];
    
    // Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
    }
    next();
  };
};

module.exports = {
  verifySecretAndToken,
  restrictTo,
};
