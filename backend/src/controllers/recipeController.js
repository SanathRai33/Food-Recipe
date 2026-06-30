const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { Op } = require("sequelize");

const createRecipe = async (req, res) => {
  try {
    const {
      title,
      description,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      servings,
      difficulty,
      dietary_preferences,
      is_public,
    } = req.body;

    // Calculate total time
    const total_time = Number(prep_time || 0) + Number(cook_time || 0);

    let parsedIngredients = ingredients;
    let parsedInstructions = instructions;
    let parsedDietary = dietary_preferences;

    if (typeof parsedIngredients === "string") {
      parsedIngredients = JSON.parse(parsedIngredients);
    }

    if (typeof parsedInstructions === "string") {
      parsedInstructions = JSON.parse(parsedInstructions);
    }

    if (typeof parsedDietary === "string") {
      parsedDietary = JSON.parse(parsedDietary);
    }

    const recipe = await Recipe.create({
      user_id: req.user.id,
      title,
      description,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      prep_time,
      cook_time,
      total_time,
      servings,
      difficulty,
      dietary_preferences: parsedDietary,
      is_public: is_public !== undefined ? is_public : true,
      image_url: req.file ? `/uploads/${req.file.filename}` : nu,
    });

    res.status(201).json({
      message: "Recipe created successfully",
      recipe,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRecipes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      dietary,
      difficulty,
      max_time,
      sort = "created_at",
      order = "DESC",
      user_id,
    } = req.query;

    const where = {};

    // Filter by user
    if (user_id) {
      where.user_id = user_id;
    }

    // Only show public recipes unless user is viewing own recipes
    if (!user_id || user_id !== req.user?.id) {
      where.is_public = true;
    }

    // Search
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { ingredients: { [Op.contains]: [search] } },
      ];
    }

    // Dietary preferences filter
    if (dietary) {
      const dietaryArray = dietary.split(",");
      where.dietary_preferences = { [Op.overlap]: dietaryArray };
    }

    // Difficulty filter
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Max preparation time filter
    if (max_time) {
      where.total_time = { [Op.lte]: parseInt(max_time) };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Recipe.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"],
        },
      ],
      order: [[sort, order]],
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
          attributes: ["id", "username", "profile_picture"],
        },
      ],
    });

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Increment view count
    await recipe.increment("views_count");

    console.log('--------------------------------------------------------------------')
    console.log(recipe)
    console.log('--------------------------------------------------------------------')

    res.json({ recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findByPk(id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // Check if user owns the recipe
    if (recipe.user_id !== req.user.id && !req.user.is_admin) {
      return res
        .status(403)
        .json({ message: "You can only edit your own recipes" });
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      prep_time,
      cook_time,
      servings,
      difficulty,
      dietary_preferences,
      is_public,
    } = req.body;

    const total_time = (prep_time || 0) + (cook_time || 0);

    await recipe.update({
      title: title || recipe.title,
      description: description || recipe.description,
      ingredients: ingredients
        ? Array.isArray(ingredients)
          ? ingredients
          : ingredients.split("\n").filter((i) => i.trim())
        : recipe.ingredients,
      instructions: instructions
        ? Array.isArray(instructions)
          ? instructions
          : instructions.split("\n").filter((i) => i.trim())
        : recipe.instructions,
      prep_time: prep_time || recipe.prep_time,
      cook_time: cook_time || recipe.cook_time,
      total_time,
      servings: servings || recipe.servings,
      difficulty: difficulty || recipe.difficulty,
      dietary_preferences: dietary_preferences || recipe.dietary_preferences,
      is_public: is_public !== undefined ? is_public : recipe.is_public,
      image_url: req.file ? req.file.location : recipe.image_url,
    });

    res.json({
      message: "Recipe updated successfully",
      recipe,
    });
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

    // Check if user owns the recipe
    if (recipe.user_id !== req.user.id && !req.user.is_admin) {
      return res
        .status(403)
        .json({ message: "You can only delete your own recipes" });
    }

    await recipe.destroy();

    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
};
