const Review = require("../models/Review");
const Rating = require("../models/Rating");
const Recipe = require("../models/Recipe");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

// This controller is now deprecated in favor of RecipeReview
// Keeping for backward compatibility
const getReviewsByRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const { count, rows } = await Review.findAndCountAll({
      where: { recipe_id: recipeId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture", "is_banned"],
          where: { is_banned: false },
          required: true
        },
      ],
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

    const response = ApiResponse.paginated("Reviews fetched successfully", rows, pagination);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get reviews by recipe error:", error);
    const response = ApiResponse.error("Failed to fetch reviews", null, 500);
    return sendResponse(res, response);
  }
};

const createReview = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { content, rating } = req.body;

    if (!content || content.trim().length === 0) {
      const response = ApiResponse.error("Review content is required", null, 400);
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
      const response = ApiResponse.error("Cannot review - account is banned", null, 403);
      return sendResponse(res, response);
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: {
        user_id: req.user.id,
        recipe_id: recipeId
      }
    });

    if (existingReview) {
      const response = ApiResponse.error("You have already reviewed this recipe", null, 400);
      return sendResponse(res, response);
    }

    const review = await Review.create({
      user_id: req.user.id,
      recipe_id: recipeId,
      content: content.trim(),
    });

    // If rating is provided, create/update rating
    if (rating && rating >= 1 && rating <= 5) {
      await Rating.upsert({
        user_id: req.user.id,
        recipe_id: recipeId,
        rating,
        review_content: content.trim()
      });
    }

    // Create activity
    await Activity.create({
      user_id: req.user.id,
      type: "reviewed_recipe",
      target_type: "recipe",
      target_id: recipeId,
      data: {
        recipe_title: recipe.title,
        recipe_id: recipeId,
        review_id: review.id,
      },
    });

    // Get user data for response
    const userData = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "profile_picture"],
    });

    const response = ApiResponse.success("Review created successfully", {
      ...review.toJSON(),
      User: userData,
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Create review error:", error);
    const response = ApiResponse.error("Failed to create review", null, 500);
    return sendResponse(res, response);
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, rating } = req.body;

    const review = await Review.findOne({
      where: { 
        id: reviewId, 
        user_id: req.user.id 
      },
    });

    if (!review) {
      const response = ApiResponse.error("Review not found or unauthorized", null, 404);
      return sendResponse(res, response);
    }

    await review.update({ content: content.trim() });

    // Update rating if provided
    if (rating && rating >= 1 && rating <= 5) {
      await Rating.upsert({
        user_id: req.user.id,
        recipe_id: review.recipe_id,
        rating,
        review_content: content.trim()
      });
    }

    const response = ApiResponse.success("Review updated successfully", review);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Update review error:", error);
    const response = ApiResponse.error("Failed to update review", null, 500);
    return sendResponse(res, response);
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      where: {
        id: reviewId,
        user_id: req.user.id,
      },
    });

    if (!review) {
      const response = ApiResponse.error("Review not found or unauthorized", null, 404);
      return sendResponse(res, response);
    }

    await review.destroy();

    const response = ApiResponse.success("Review deleted successfully");
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Delete review error:", error);
    const response = ApiResponse.error("Failed to delete review", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  getReviewsByRecipe,
  createReview,
  updateReview,
  deleteReview,
};