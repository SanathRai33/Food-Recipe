const Review = require("../models/Review");
const Recipe = require("../models/Recipe");
const Activity = require("../models/Activity");

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
          attributes: ["id", "username", "profile_picture"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      reviews: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createReview = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Review content is required" });
    }

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const review = await Review.create({
      user_id: req.user.id,
      recipe_id: recipeId,
      content: content.trim(),
    });

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
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "profile_picture"],
    });

    res.status(201).json({
      message: "Review created successfully",
      review: {
        ...review.toJSON(),
        User: user,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;

    const review = await Review.findOne({
      where: { id: reviewId, user_id: req.user.id },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.update({ content: content.trim() });

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
      return res.status(404).json({ message: "Review not found" });
    }

    await review.destroy();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getReviewsByRecipe,
    createReview,
    updateReview,
    deleteReview
}