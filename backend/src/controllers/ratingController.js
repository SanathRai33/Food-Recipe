const Rating = require("../models/Rating");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { Op } = require("sequelize");

const createOrUpdateRating = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const [ratingObj, created] = await Rating.upsert(
      {
        user_id: req.user.id,
        recipe_id: recipeId,
        rating,
      },
      {
        returning: true,
      },
    );

    // Calculate average rating
    const ratings = await Rating.findAll({
      where: { recipe_id: recipeId },
      attributes: ["rating"],
    });

    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // You could store average rating on recipe if needed

    res.json({
      message: created ? "Rating created" : "Rating updated",
      rating: ratingObj,
      average_rating: avgRating,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRecipeRatings = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const ratings = await Rating.findAll({
      where: { recipe_id: recipeId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"],
        },
      ],
    });

    const average =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json({
      ratings,
      average_rating: average,
      total_ratings: ratings.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

    res.json({ rating: rating ? rating.rating : null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createOrUpdateRating,
  getRecipeRatings,
  getUserRating,
};
