const { verifyToken } = require("../config/jwt");
const User = require("../models/User");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");

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
      const response = ApiResponse.error(
        "Your account has been banned",
        {
          reason: user.ban_reason || "No reason provided",
          banned_at: user.banned_at
        },
        403
      );
      return sendResponse(res, response);
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_banned: user.is_banned
    };

    next();
  } catch (error) {
    console.error(error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

const checkBanned = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    return user && user.is_banned;
  } catch (error) {
    return false;
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await User.findByPk(decoded.userId);
        if (user && !user.is_banned) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin,
            is_banned: user.is_banned
          };
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, checkBanned, optionalAuth };