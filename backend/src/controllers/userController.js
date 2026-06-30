const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Favorite = require("../models/Favorite");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
    });
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, bio, dietary_preferences, profile_picture } =
      req.body;
    const user = await User.findByPk(req.user.id);

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      bio: bio !== undefined ? bio : user.bio,
      dietary_preferences: dietary_preferences || user.dietary_preferences,
      profile_picture: profile_picture || user.profile_picture,
    });

    res.json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    const isValid = await user.comparePassword(current_password);
    if (!isValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password_hash = new_password;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash", "email"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserRecipes = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const { count, rows } = await Recipe.findAndCountAll({
      where: { user_id: id, is_public: true },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      recipes: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [
        {
          model: Recipe,
          as: "favorites",
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getUserById,
    getUserRecipes,
    getUserFavorites,
}