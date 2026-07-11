const Rating = require("../models/Rating");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { Op } = require("sequelize");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

// This controller is now deprecated in favor of RecipeReview
// Keeping for backward compatibility
const createOrUpdateRating = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating, review_content } = req.body;

    if (rating < 1 || rating > 5) {
      const response = ApiResponse.error("Rating must be between 1 and 5", null, 400);
      return sendResponse(res, response);
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      const response = ApiResponse.error("Recipe not found", null, 404);
      return sendResponse(res, response);
    }

    // Check if user is banned
    const user = await User.findByPk(req.user.id);
    if (user && user.is_banned) {
      const response = ApiResponse.error("Cannot rate - account is banned", null, 403);
      return sendResponse(res, response);
    }

    const [ratingObj, created] = await Rating.upsert(
      {
        user_id: req.user.id,
        recipe_id: recipeId,
        rating,
        review_content: review_content || null
      },
      {
        returning: true,
      }
    );

    // Calculate average rating
    const ratings = await Rating.findAll({
      where: { recipe_id: recipeId },
      attributes: ["rating"],
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    const response = ApiResponse.success(
      created ? "Rating created" : "Rating updated",
      {
        rating: ratingObj,
        average_rating: Math.round(avgRating * 10) / 10,
        total_ratings: ratings.length
      }
    );
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Create/update rating error:", error);
    const response = ApiResponse.error("Failed to save rating", null, 500);
    return sendResponse(res, response);
  }
};

const getRecipeRatings = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Rating.findAndCountAll({
      where: { recipe_id: recipeId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"],
          where: { is_banned: false },
          required: true
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const average = rows.length > 0
      ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
      : 0;

    const pagination = {
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
      limit: parseInt(limit),
      average_rating: Math.round(average * 10) / 10,
      total_ratings: count
    };

    const response = ApiResponse.paginated("Ratings fetched successfully", rows, pagination);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get recipe ratings error:", error);
    const response = ApiResponse.error("Failed to fetch ratings", null, 500);
    return sendResponse(res, response);
  }
};

const getUserRating = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const rating = await Rating.findOne({
      where: {
        user_id: req.user.id,
        recipe_id: recipeId,
      },
    });

    const response = ApiResponse.success("User rating fetched", { 
      rating: rating ? rating.rating : null,
      review_content: rating ? rating.review_content : null
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get user rating error:", error);
    const response = ApiResponse.error("Failed to fetch user rating", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  createOrUpdateRating,
  getRecipeRatings,
  getUserRating,
};