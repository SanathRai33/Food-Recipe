const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Favorite = require("../models/Favorite");
const Follow = require("../models/Follow");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
      include: [
        {
          model: User,
          as: "followers",
          attributes: ["id", "username", "profile_picture"],
          through: { attributes: [] }
        },
        {
          model: User,
          as: "following",
          attributes: ["id", "username", "profile_picture"],
          through: { attributes: [] }
        }
      ]
    });

    const userData = user.toJSON();
    
    // If user is banned, hide follower counts
    if (user.is_banned) {
      userData.followers = [];
      userData.following = [];
      userData.followers_count = 0;
      userData.following_count = 0;
      userData.profile_message = "This account has been banned";
    } else {
      userData.followers_count = user.followers ? user.followers.length : 0;
      userData.following_count = user.following ? user.following.length : 0;
    }

    const response = ApiResponse.success("Profile fetched successfully", userData);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get profile error:", error);
    const response = ApiResponse.error("Failed to fetch profile", null, 500);
    return sendResponse(res, response);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, bio, dietary_preferences, profile_picture } = req.body;
    const user = await User.findByPk(req.user.id);

    if (user.is_banned) {
      const response = ApiResponse.error("Cannot update profile - account is banned", null, 403);
      return sendResponse(res, response);
    }

    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      bio: bio !== undefined ? bio : user.bio,
      dietary_preferences: dietary_preferences || user.dietary_preferences,
      profile_picture: profile_picture || user.profile_picture,
    });

    const response = ApiResponse.success("Profile updated successfully", user.toJSON());
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Update profile error:", error);
    const response = ApiResponse.error("Failed to update profile", null, 500);
    return sendResponse(res, response);
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (user.is_banned) {
      const response = ApiResponse.error("Cannot change password - account is banned", null, 403);
      return sendResponse(res, response);
    }

    const isValid = await user.comparePassword(current_password);
    if (!isValid) {
      const response = ApiResponse.error("Current password is incorrect", null, 400);
      return sendResponse(res, response);
    }

    user.password_hash = new_password;
    await user.save();

    const response = ApiResponse.success("Password changed successfully");
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Change password error:", error);
    const response = ApiResponse.error("Failed to change password", null, 500);
    return sendResponse(res, response);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash", "email"] },
      include: [
        {
          model: User,
          as: "followers",
          attributes: ["id", "username", "profile_picture"],
          through: { attributes: [] }
        },
        {
          model: User,
          as: "following",
          attributes: ["id", "username", "profile_picture"],
          through: { attributes: [] }
        }
      ]
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    const userData = user.toJSON();
    
    // Check if the requested user is banned
    if (user.is_banned) {
      // Hide all social data for banned users
      userData.followers = [];
      userData.following = [];
      userData.followers_count = 0;
      userData.following_count = 0;
      userData.is_banned = true;
      userData.profile_message = "This account has been banned";
      userData.bio = "Account unavailable";
      userData.first_name = null;
      userData.last_name = null;
      userData.dietary_preferences = [];
      
      const response = ApiResponse.success("User profile fetched", userData);
      return sendResponse(res, response);
    }

    userData.followers_count = user.followers ? user.followers.length : 0;
    userData.following_count = user.following ? user.following.length : 0;

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        where: {
          follower_id: req.user.id,
          following_id: id
        }
      });
      isFollowing = !!follow;
    }
    userData.is_following = isFollowing;

    const response = ApiResponse.success("User profile fetched successfully", userData);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get user by id error:", error);
    const response = ApiResponse.error("Failed to fetch user", null, 500);
    return sendResponse(res, response);
  }
};

const getUserRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    // Check if user is banned
    const user = await User.findByPk(req.user.id);
    if (user && user.is_banned) {
      const response = ApiResponse.error("Cannot fetch recipes - account is banned", null, 403);
      return sendResponse(res, response);
    }

    const { count, rows } = await Recipe.findAndCountAll({
      where: {
        user_id: req.user.id,
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const pagination = {
      total: count,
      page: Number(page),
      total_pages: Math.ceil(count / limit),
      limit: Number(limit)
    };

    const response = ApiResponse.paginated("User recipes fetched successfully", rows, pagination);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get user recipes error:", error);
    const response = ApiResponse.error("Failed to fetch user recipes", null, 500);
    return sendResponse(res, response);
  }
};

const getProfileRecipes = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;

    // Check if user is banned
    const user = await User.findByPk(id);
    if (user && user.is_banned) {
      const response = ApiResponse.error("User account is banned", null, 403);
      return sendResponse(res, response);
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Recipe.findAndCountAll({
      where: {
        user_id: id,
        is_public: true,
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const pagination = {
      total: count,
      page: Number(page),
      total_pages: Math.ceil(count / limit),
      limit: Number(limit)
    };

    const response = ApiResponse.paginated("User recipes fetched successfully", rows, pagination);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get profile recipes error:", error);
    const response = ApiResponse.error("Failed to fetch user recipes", null, 500);
    return sendResponse(res, response);
  }
};

const getUserFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] }
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    if (user.is_banned) {
      const response = ApiResponse.error("User account is banned", null, 403);
      return sendResponse(res, response);
    }

    const favorites = await Favorite.findAll({
      where: { user_id: id },
      include: [
        {
          model: Recipe,
          as: "Recipe",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "username", "profile_picture"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    const response = ApiResponse.success("Favorites fetched successfully", favorites);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get user favorites error:", error);
    const response = ApiResponse.error("Failed to fetch favorites", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  getUserRecipes,
  getUserFavorites,
  getProfileRecipes,
};