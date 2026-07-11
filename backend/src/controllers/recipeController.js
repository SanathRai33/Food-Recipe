const { Op, Sequelize } = require("sequelize");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const { uploadToS3, deleteFromS3 } = require("../utils/s3Upload");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const sequelize = require("../config/database");

const createRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
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

    let imageUrl = null;

    if (req.file) {
      imageUrl = await uploadToS3(req.file, "recipes");
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
      image_url: imageUrl,
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("Recipe created successfully", recipe);
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Create recipe error:", error);
    const response = ApiResponse.error("Failed to create recipe", null, 500);
    return sendResponse(res, response);
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
      min_time,
      sort = "created_at",
      order = "DESC",
      user_id,
      exclude_banned = true,
      is_public_only = true,
    } = req.query;

    const where = {};
    const include = [];

    // Base user filter - exclude banned users by default
    if (exclude_banned === 'true' || exclude_banned === true) {
      include.push({
        model: User,
        as: "User",
        attributes: ["id", "username", "profile_picture", "first_name", "last_name", "is_banned"],
        where: {
          is_banned: false
        },
        required: true
      });
    } else {
      include.push({
        model: User,
        as: "User",
        attributes: ["id", "username", "profile_picture", "first_name", "last_name", "is_banned"],
      });
    }

    // Filter by user
    if (user_id) {
      where.user_id = user_id;
    }

    // Only show public recipes unless user is viewing own recipes
    if (is_public_only === 'true' || is_public_only === true) {
      if (!user_id || user_id !== req.user?.id) {
        where.is_public = true;
      }
    }

    // Advanced Search functionality
    if (search) {
      const searchTerms = search.split(',').map(term => term.trim());
      
      where[Op.or] = [
        // Title search
        ...searchTerms.map(term => ({
          title: { [Op.iLike]: `%${term}%` }
        })),
        // Description search
        ...searchTerms.map(term => ({
          description: { [Op.iLike]: `%${term}%` }
        })),
        // Ingredients search - using ANY for array search
        ...searchTerms.map(term => ({
          ingredients: { [Op.contains]: [term] }
        })),
        // Full text search (PostgreSQL specific)
        Sequelize.literal(`to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || array_to_string(ingredients, ' ')) @@ to_tsquery('english', '${searchTerms.join(' & ')}')`)
      ];
    }

    // Dietary preferences filter - handle multiple selections
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

    // Min preparation time filter
    if (min_time) {
      where.total_time = { ...where.total_time, [Op.gte]: parseInt(min_time) };
    }

    const offset = (page - 1) * limit;
    
    // Determine sort field
    let sortField = sort;
    if (sort === 'popular') {
      sortField = 'views_count';
    } else if (sort === 'most_favorited') {
      sortField = 'favorites_count';
    } else if (sort === 'highest_rated') {
      // For highest rated, we need to join with ratings
      // This will be handled separately
      sortField = 'created_at';
    }

    const { count, rows } = await Recipe.findAndCountAll({
      where,
      include,
      order: [[sortField, order]],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
    });

    // Calculate average ratings if needed
    const recipesWithRatings = await Promise.all(rows.map(async (recipe) => {
      const recipeData = recipe.toJSON();
      
      // Get average rating from unified reviews if available
      if (recipeData.ratings) {
        const avgRating = recipeData.ratings.reduce((sum, r) => sum + r.rating, 0) / recipeData.ratings.length;
        recipeData.average_rating = avgRating || 0;
      }
      
      return recipeData;
    }));

    const pagination = {
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
      limit: parseInt(limit)
    };

    const response = ApiResponse.paginated(
      "Recipes fetched successfully",
      recipesWithRatings,
      pagination
    );
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get recipes error:", error);
    const response = ApiResponse.error("Failed to fetch recipes", null, 500);
    return sendResponse(res, response);
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
          attributes: ["id", "username", "profile_picture", "first_name", "last_name", "is_banned"],
        },
        {
          model: User,
          as: "favorited_by",
          attributes: ["id", "username"],
          through: { attributes: [] }
        }
      ],
    });

    if (!recipe) {
      const response = ApiResponse.error("Recipe not found", null, 404);
      return sendResponse(res, response);
    }

    // Check if recipe owner is banned
    if (recipe.User && recipe.User.is_banned) {
      const response = ApiResponse.error("This recipe is unavailable", null, 403);
      return sendResponse(res, response);
    }

    // Increment view count
    await recipe.increment("views_count");

    // Get average rating
    let averageRating = 0;
    let totalReviews = 0;
    
    // Try to get from unified reviews if available
    try {
      const stats = await RecipeReview.findAll({
        where: { recipe_id: id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews']
        ]
      });
      
      if (stats && stats.length > 0) {
        averageRating = parseFloat(stats[0].get('average_rating')) || 0;
        totalReviews = parseInt(stats[0].get('total_reviews')) || 0;
      }
    } catch (e) {
      // If unified table doesn't exist, try legacy tables
      try {
        const ratings = await Rating.findAll({
          where: { recipe_id: id },
          attributes: ["rating"]
        });
        averageRating = ratings.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
          : 0;
        
        const reviews = await Review.findAll({
          where: { recipe_id: id },
          attributes: ["id"]
        });
        totalReviews = reviews.length;
      } catch (error) {
        // Silently fail
      }
    }

    const recipeData = recipe.toJSON();
    recipeData.average_rating = Math.round(averageRating * 10) / 10;
    recipeData.total_reviews = totalReviews;

    const response = ApiResponse.success("Recipe fetched successfully", recipeData);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get recipe by id error:", error);
    const response = ApiResponse.error("Failed to fetch recipe", null, 500);
    return sendResponse(res, response);
  }
};

const updateRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id, { transaction });

    if (!recipe) {
      const response = ApiResponse.error("Recipe not found", null, 404);
      return sendResponse(res, response);
    }

    if (recipe.user_id !== req.user.id && !req.user.is_admin) {
      const response = ApiResponse.error("You can only edit your own recipes", null, 403);
      return sendResponse(res, response);
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

    let parsedIngredients = recipe.ingredients;
    let parsedInstructions = recipe.instructions;
    let parsedDietary = recipe.dietary_preferences;

    if (ingredients) {
      parsedIngredients =
        typeof ingredients === "string"
          ? JSON.parse(ingredients)
          : ingredients;
    }

    if (instructions) {
      parsedInstructions =
        typeof instructions === "string"
          ? JSON.parse(instructions)
          : instructions;
    }

    if (dietary_preferences) {
      parsedDietary =
        typeof dietary_preferences === "string"
          ? JSON.parse(dietary_preferences)
          : dietary_preferences;
    }

    const total_time =
      Number(prep_time || recipe.prep_time) +
      Number(cook_time || recipe.cook_time);

    let imageUrl = recipe.image_url;

    if (req.file) {
      if (recipe.image_url) {
        await deleteFromS3(recipe.image_url);
      }
      imageUrl = await uploadToS3(req.file, "recipes");
    }

    await recipe.update({
      title: title || recipe.title,
      description: description || recipe.description,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      prep_time: prep_time || recipe.prep_time,
      cook_time: cook_time || recipe.cook_time,
      total_time,
      servings: servings || recipe.servings,
      difficulty: difficulty || recipe.difficulty,
      dietary_preferences: parsedDietary,
      is_public: is_public !== undefined ? is_public : recipe.is_public,
      image_url: imageUrl,
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("Recipe updated successfully", recipe);
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Update recipe error:", error);
    const response = ApiResponse.error("Failed to update recipe", null, 500);
    return sendResponse(res, response);
  }
};

const deleteRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id, { transaction });

    if (!recipe) {
      const response = ApiResponse.error("Recipe not found", null, 404);
      return sendResponse(res, response);
    }

    if (recipe.user_id !== req.user.id && !req.user.is_admin) {
      const response = ApiResponse.error("You can only delete your own recipes", null, 403);
      return sendResponse(res, response);
    }

    if (recipe.image_url) {
      await deleteFromS3(recipe.image_url);
    }

    await recipe.destroy({ transaction });
    await transaction.commit();

    const response = ApiResponse.success("Recipe deleted successfully");
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Delete recipe error:", error);
    const response = ApiResponse.error("Failed to delete recipe", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
};