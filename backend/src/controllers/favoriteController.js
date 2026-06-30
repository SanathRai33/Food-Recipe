const Favorite = require("../models/Favorite");
const Recipe = require("../models/Recipe");
const Activity = require("../models/Activity");

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
              attributes: ["id", "username", "profile_picture"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addFavorite = async (req, res) => {
  try {
    const { recipe_id } = req.body;

    // Check if recipe exists
    const recipe = await Recipe.findByPk(recipe_id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      where: { user_id: req.user.id, recipe_id },
    });

    if (existing) {
      return res.status(400).json({ message: "Recipe already in favorites" });
    }

    const favorite = await Favorite.create({
      user_id: req.user.id,
      recipe_id,
    });

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
    });

    res.status(201).json({
      message: "Recipe added to favorites",
      favorite,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const favorite = await Favorite.findOne({
      where: { user_id: req.user.id, recipe_id },
    });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    await favorite.destroy();

    res.json({ message: "Recipe removed from favorites" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const favorite = await Favorite.findOne({
      where: { user_id: req.user.id, recipe_id },
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite
}
