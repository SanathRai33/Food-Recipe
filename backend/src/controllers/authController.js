const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const { validationResult } = require("express-validator");

const register = async (req, res) => {

  console.log("REgister function by controller")
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, first_name, last_name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or username",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      first_name,
      last_name,
    });

    // Generate token
    const token = generateToken(user.id, user.is_admin);

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is banned
    if (user.is_banned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id, user.is_admin);

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register, 
  login,
  getCurrentUser
}