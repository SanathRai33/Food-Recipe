const { verifyToken } = require("../config/jwt");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_banned: user.is_banned,
    };

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { authenticate };
