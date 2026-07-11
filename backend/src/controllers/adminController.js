const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Review = require("../models/Review");
const Rating = require("../models/Rating");
const Favorite = require("../models/Favorite");
const Collection = require("../models/Collection");
const CollectionRecipe = require("../models/CollectionRecipe");
const Follow = require("../models/Follow");
const Activity = require("../models/Activity");
const RecipeReview = require("../models/RecipeReview");
const { Op } = require("sequelize");
const sequelize = require('../config/database');
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const bannedUsers = await User.count({ where: { is_banned: true } });
    const totalRecipes = await Recipe.count();
    const totalReviews = await Review.count();
    const totalFavorites = await Favorite.count();

    // Get average rating from unified reviews if exists
    let averageRating = 0;
    try {
      const ratings = await RecipeReview.findAll({
        attributes: ["rating"]
      });
      averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
    } catch (e) {
      // Fallback to legacy ratings
      const ratings = await Rating.findAll({
        attributes: ["rating"]
      });
      averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
    }

    const response = ApiResponse.success("Stats fetched successfully", {
      totalUsers,
      bannedUsers,
      totalRecipes,
      totalReviews,
      totalFavorites,
      averageRating: Math.round(averageRating * 10) / 10
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get stats error:", error);
    const response = ApiResponse.error("Failed to fetch stats", null, 500);
    return sendResponse(res, response);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, include_banned = false } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (include_banned !== 'true' && include_banned !== true) {
      where.is_banned = false;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    const pagination = {
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
      limit: parseInt(limit)
    };

    const response = ApiResponse.paginated("Users fetched successfully", rows, pagination);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get all users error:", error);
    const response = ApiResponse.error("Failed to fetch users", null, 500);
    return sendResponse(res, response);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    const response = ApiResponse.success("User fetched successfully", user);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get user by id error:", error);
    const response = ApiResponse.error("Failed to fetch user", null, 500);
    return sendResponse(res, response);
  }
};

const banUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (id === req.user.id) {
      const response = ApiResponse.error("Cannot ban yourself", null, 400);
      return sendResponse(res, response);
    }

    const user = await User.findByPk(id, { transaction });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    if (user.is_admin) {
      const response = ApiResponse.error("Cannot ban an admin user", null, 400);
      return sendResponse(res, response);
    }

    await user.update({
      is_banned: true,
      ban_reason: reason || "No reason provided",
      banned_at: new Date(),
      banned_by: req.user.id
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("User banned successfully", {
      id: user.id,
      is_banned: user.is_banned,
      ban_reason: user.ban_reason,
      banned_at: user.banned_at
    });
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Ban user error:", error);
    const response = ApiResponse.error("Failed to ban user", null, 500);
    return sendResponse(res, response);
  }
};

const unbanUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, { transaction });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    await user.update({
      is_banned: false,
      ban_reason: null,
      banned_at: null,
      banned_by: null
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("User unbanned successfully", {
      id: user.id,
      is_banned: user.is_banned
    });
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Unban user error:", error);
    const response = ApiResponse.error("Failed to unban user", null, 500);
    return sendResponse(res, response);
  }
};

const deleteUser = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const user = await User.findByPk(id, { transaction: t });

    if (!user) {
      await t.rollback(); 
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (id === req.user.id) {
      await t.rollback();
      return res.status(400).json({
        message: "Cannot delete your own account",
      });
    }

    const recipes = await Recipe.findAll({
      where: { user_id: id },
      attributes: ['id'], 
      transaction: t
    });
    const recipeIds = recipes.map(r => r.id);

    if (recipeIds.length > 0) {
      await Favorite.destroy({ where: { recipe_id: recipeIds }, transaction: t });
      await Rating.destroy({ where: { recipe_id: recipeIds }, transaction: t });
      await Review.destroy({ where: { recipe_id: recipeIds }, transaction: t });
      await CollectionRecipe.destroy({ where: { recipe_id: recipeIds }, transaction: t });
      await Activity.destroy({ where: { target_id: recipeIds }, transaction: t });
      
      await Recipe.destroy({ where: { user_id: id }, transaction: t });
    }

    const collections = await Collection.findAll({
      where: { user_id: id },
      attributes: ['id'],
      transaction: t
    });
    const collectionIds = collections.map(c => c.id);

    if (collectionIds.length > 0) {
      await CollectionRecipe.destroy({ where: { collection_id: collectionIds }, transaction: t });
      await Collection.destroy({ where: { user_id: id }, transaction: t });
    }

    await Favorite.destroy({ where: { user_id: id }, transaction: t });
    await Rating.destroy({ where: { user_id: id }, transaction: t });
    await Review.destroy({ where: { user_id: id }, transaction: t });
    await Activity.destroy({ where: { user_id: id }, transaction: t });
    
    // Follows
    await Follow.destroy({ where: { follower_id: id }, transaction: t });
    await Follow.destroy({ where: { following_id: id }, transaction: t });

    await user.destroy({ transaction: t });

    await t.commit();

    return res.json({
      message: "User deleted successfully",
    });

  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ is_admin: true });

    res.json({ message: "User made admin successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const removeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow removing admin from self
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot remove your own admin privileges" });
    }

    await user.update({ is_admin: false });

    res.json({ message: "Admin privileges removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status === "public") {
      where.is_public = true;
    } else if (status === "private") {
      where.is_public = false;
    }

    const { count, rows } = await Recipe.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username"],
        },
      ],
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

const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByPk(id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.json({ recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    await recipe.destroy();

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleRecipeVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    await recipe.update({ is_public: !recipe.is_public });

    res.json({
      message: `Recipe visibility updated to ${recipe.is_public ? "public" : "private"}`,
      is_public: recipe.is_public,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getStats,
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    deleteUser,
    makeAdmin,
    removeAdmin,
    getAllRecipes,
    getRecipeById,
    deleteRecipe,
    toggleRecipeVisibility
}