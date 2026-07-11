const Favorite = require("../models/Favorite");
const Recipe = require("../models/Recipe");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const sequelize = require("../config/database");

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Recipe,
          as: "Recipe",
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "username", "profile_picture", "is_banned"],
              where: { is_banned: false },
              required: true
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const response = ApiResponse.success("Favorites fetched successfully", favorites);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get favorites error:", error);
    const response = ApiResponse.error("Failed to fetch favorites", null, 500);
    return sendResponse(res, response);
  }
};

const addFavorite = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { recipe_id } = req.body;

    if (!recipe_id) {
      const response = ApiResponse.error("Recipe ID is required", null, 400);
      return sendResponse(res, response);
    }

    // Check if recipe exists and is not from banned user
    const recipe = await Recipe.findByPk(recipe_id, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "is_banned"]
        }
      ],
      transaction
    });
    
    if (!recipe) {
      const response = ApiResponse.error("Recipe not found", null, 404);
      return sendResponse(res, response);
    }

    if (recipe.User && recipe.User.is_banned) {
      const response = ApiResponse.error("Cannot favorite - recipe owner is banned", null, 403);
      return sendResponse(res, response);
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      where: { 
        user_id: req.user.id, 
        recipe_id 
      },
      transaction
    });

    if (existing) {
      const response = ApiResponse.error("Recipe already in favorites", null, 400);
      return sendResponse(res, response);
    }

    const favorite = await Favorite.create({
      user_id: req.user.id,
      recipe_id,
    }, { transaction });

    // Increment favorites count on recipe
    await recipe.increment("favorites_count", { transaction });

    // Create activity
    await Activity.create({
      user_id: req.user.id,
      type: "favorited_recipe",
      target_type: "recipe",
      target_id: recipe_id,
      data: {
        recipe_title: recipe.title,
        recipe_id: recipe_id,
      },
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("Recipe added to favorites", favorite);
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Add favorite error:", error);
    const response = ApiResponse.error("Failed to add favorite", null, 500);
    return sendResponse(res, response);
  }
};

const removeFavorite = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { recipe_id } = req.params;

    const favorite = await Favorite.findOne({
      where: { 
        user_id: req.user.id, 
        recipe_id 
      },
      transaction
    });

    if (!favorite) {
      const response = ApiResponse.error("Favorite not found", null, 404);
      return sendResponse(res, response);
    }

    await favorite.destroy({ transaction });

    // Decrement favorites count on recipe
    await Recipe.decrement("favorites_count", {
      where: { id: recipe_id },
      transaction
    });

    await transaction.commit();

    const response = ApiResponse.success("Recipe removed from favorites");
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Remove favorite error:", error);
    const response = ApiResponse.error("Failed to remove favorite", null, 500);
    return sendResponse(res, response);
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const favorite = await Favorite.findOne({
      where: { 
        user_id: req.user.id, 
        recipe_id 
      },
    });

    const response = ApiResponse.success("Favorite check completed", { 
      isFavorite: !!favorite 
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Check favorite error:", error);
    const response = ApiResponse.error("Failed to check favorite", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
};