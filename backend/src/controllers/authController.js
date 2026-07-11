const User = require("../models/User");
const { generateToken, generateRefreshToken, verifyRefreshToken } = require("../config/jwt");
const { validationResult } = require("express-validator");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const sequelize = require("../config/database");

const register = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = ApiResponse.error("Validation error", errors.array(), 400);
      return sendResponse(res, response);
    }

    const { username, email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ email }, { username }],
      },
      transaction
    });

    if (existingUser) {
      const response = ApiResponse.error("User already exists with this email or username", null, 400);
      return sendResponse(res, response);
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      first_name,
      last_name,
    }, { transaction });

    await transaction.commit();

    // Generate tokens
    const token = generateToken(user.id, user.is_admin);
    const refreshToken = generateRefreshToken(user.id);

    const response = ApiResponse.success("User registered successfully", {
      user: user.toJSON(),
      token,
      refreshToken
    });
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Register error:", error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = ApiResponse.error("Validation error", errors.array(), 400);
      return sendResponse(res, response);
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const response = ApiResponse.error("Invalid credentials", null, 401);
      return sendResponse(res, response);
    }

    // Check if user is banned
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

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const response = ApiResponse.error("Invalid credentials", null, 401);
      return sendResponse(res, response);
    }

    // Generate tokens
    const token = generateToken(user.id, user.is_admin);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await user.update({ last_login: new Date() });

    const response = ApiResponse.success("Login successful", {
      user: user.toJSON(),
      token,
      refreshToken
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Login error:", error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] }
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    if (user.is_banned) {
      const response = ApiResponse.error("Your account has been banned", null, 403);
      return sendResponse(res, response);
    }

    const response = ApiResponse.success("User fetched successfully", user);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get current user error:", error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const response = ApiResponse.error("Refresh token is required", null, 400);
      return sendResponse(res, response);
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      const response = ApiResponse.error("Invalid or expired refresh token", null, 401);
      return sendResponse(res, response);
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    if (user.is_banned) {
      const response = ApiResponse.error("Your account has been banned", null, 403);
      return sendResponse(res, response);
    }

    // Generate new tokens
    const newToken = generateToken(user.id, user.is_admin);
    const newRefreshToken = generateRefreshToken(user.id);

    const response = ApiResponse.success("Token refreshed successfully", {
      token: newToken,
      refreshToken: newRefreshToken
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Refresh token error:", error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

const logout = async (req, res) => {
  try {
    // Since we're using JWT, we don't need to invalidate the token on server side
    // Client should remove the token from storage
    const response = ApiResponse.success("Logout successful. Please remove your tokens on client side.");
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Logout error:", error);
    const response = ApiResponse.error("Server error", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout
};