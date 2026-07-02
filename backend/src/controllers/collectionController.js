const Collection = require("../models/Collection");
const CollectionRecipe = require("../models/CollectionRecipe");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

const getCollections = async (req, res) => {
  try {
    const collections = await Collection.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Recipe,
          as: "recipes",
          through: { attributes: [] },
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ collections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findOne({
      where: { id, user_id: req.user.id },
      include: [
        {
          model: Recipe,
          as: "recipes",
          through: { attributes: [] },
          include: [
            {
              model: User,
              as: "User",
              attributes: ["id", "username", "profile_picture"],
            },
          ],
        },
      ],
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.json({ collection });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createCollection = async (req, res) => {
  try {
    const { name, description, is_public } = req.body;

    const collection = await Collection.create({
      user_id: req.user.id,
      name,
      description,
      is_public: is_public !== undefined ? is_public : true,
    });

    res.status(201).json({
      message: "Collection created successfully",
      collection,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_public } = req.body;

    const collection = await Collection.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    await collection.update({
      name: name || collection.name,
      description:
        description !== undefined ? description : collection.description,
      is_public: is_public !== undefined ? is_public : collection.is_public,
    });

    res.json({
      message: "Collection updated successfully",
      collection,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    await collection.destroy();

    res.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const addRecipeToCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { recipe_id } = req.body;

    const collection = await Collection.findOne({
      where: { id: collectionId, user_id: req.user.id },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const recipe = await Recipe.findByPk(recipe_id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const existing = await CollectionRecipe.findOne({
      where: { collection_id: collectionId, recipe_id },
    });

    if (existing) {
      return res.status(400).json({ message: "Recipe already in collection" });
    }

    await CollectionRecipe.create({
      collection_id: collectionId,
      recipe_id,
    });

    res.json({ message: "Recipe added to collection" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const removeRecipeFromCollection = async (req, res) => {
  try {
    const { collectionId, recipeId } = req.params;

    const collection = await Collection.findOne({
      where: { id: collectionId, user_id: req.user.id },
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const deleted = await CollectionRecipe.destroy({
      where: { collection_id: collectionId, recipe_id: recipeId },
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Recipe not found in collection" });
    }

    res.json({ message: "Recipe removed from collection" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    getCollections,
    getCollectionById,
    createCollection,
    updateCollection,
    deleteCollection,
    addRecipeToCollection,
    removeRecipeFromCollection
}