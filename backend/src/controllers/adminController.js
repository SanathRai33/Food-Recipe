const User = require("../models/User");
const Recipe = require("../models/Recipe");
const Review = require("../models/Review");
const Rating = require("../models/Rating");
const { Op } = require("sequelize");

// Dashboard Stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalRecipes = await Recipe.count();
    const totalReviews = await Review.count();

    const ratings = await Rating.findAll({
      attributes: ["rating"],
    });
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    // Recent activities (simplified)
    const recentActivities = await User.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
      attributes: ["id", "username", "profile_picture", "created_at"],
    });

    res.json({
      totalUsers,
      totalRecipes,
      totalReviews,
      averageRating,
      recentActivities: recentActivities.map((user) => ({
        ...user.toJSON(),
        description: `${user.username} joined RecipeShare`,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
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

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ is_banned: true });

    res.json({ message: "User banned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ is_banned: false });

    res.json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow deleting self
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await user.destroy();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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

// Recipe Management
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
