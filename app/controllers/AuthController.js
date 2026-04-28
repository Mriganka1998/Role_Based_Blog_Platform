const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const handleAuthOperations = async (req, res) => {
  try {
    const method = req.method;
    const action = req.query.action; // register, login, refresh

    if (method !== "POST") {
      return res.status(405).json({ message: "Method not allowed for auth endpoint. Use POST." });
    }

    if (action === "register" || action === "create_author") {
      const { name, email, password, role } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already exists" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "User"
      });

      return res.status(201).json({ success: true, message: "User registered successfully", user: { id: user._id, name: user.name, role: user.role } });
    }

    if (action === "login" || action === "login_author") {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      const tokens = generateTokens(user);
      return res.status(200).json({ success: true, message: "Logged in successfully", ...tokens, user: { id: user._id, name: user.name, role: user.role } });
    }

    if (action === "refresh") {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(401).json({ message: "Refresh token is required" });

      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "Invalid token data" });

        const tokens = generateTokens(user);
        return res.status(200).json({ success: true, message: "Token refreshed", ...tokens });
      } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
      }
    }

    return res.status(400).json({ message: "Invalid action query parameter. Use ?action=register|login|refresh" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleAuthOperations
};
