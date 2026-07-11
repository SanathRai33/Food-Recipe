const User = require("./User");
const Recipe = require("./Recipe");
const Favorite = require("./Favorite");
const Collection = require("./Collection");
const CollectionRecipe = require("./CollectionRecipe");
const Rating = require("./Rating");
const Review = require("./Review");
const Follow = require("./Follow");
const Activity = require("./Activity");

// User - Recipe relationships
User.hasMany(Recipe, {
  foreignKey: "user_id",
  as: "recipes",
  onDelete: "CASCADE",
  hooks: true,
});
Recipe.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
  onDelete: "CASCADE",
});

// User - Favorite relationships
User.belongsToMany(Recipe, {
  through: Favorite,
  foreignKey: "user_id",
  otherKey: "recipe_id",
  as: "favorites",
  onDelete: "CASCADE",
});
Recipe.belongsToMany(User, {
  through: Favorite,
  foreignKey: "recipe_id",
  otherKey: "user_id",
  as: "favorited_by",
  onDelete: "CASCADE",
});

// User - Collection relationships
User.hasMany(Collection, {
  foreignKey: "user_id",
  as: "collections",
  onDelete: "CASCADE",
  hooks: true,
});
Collection.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
  onDelete: "CASCADE",
});

// Collection - Recipe relationships
Collection.belongsToMany(Recipe, {
  through: CollectionRecipe,
  foreignKey: "collection_id",
  otherKey: "recipe_id",
  as: "recipes",
  onDelete: "CASCADE",
});
Recipe.belongsToMany(Collection, {
  through: CollectionRecipe,
  foreignKey: "recipe_id",
  otherKey: "collection_id",
  as: "collections",
  onDelete: "CASCADE",
});

// User - Rating relationships
User.hasMany(Rating, { foreignKey: "user_id", as: "ratings", onDelete: "CASCADE", hooks: true });
Rating.belongsTo(User, { foreignKey: "user_id", as: "User", onDelete: "CASCADE" });
Recipe.hasMany(Rating, { foreignKey: "recipe_id", as: "ratings", onDelete: "CASCADE", hooks: true });
Rating.belongsTo(Recipe, { foreignKey: "recipe_id", as: "Recipe", onDelete: "CASCADE" });

// User - Review relationships
User.hasMany(Review, { foreignKey: "user_id", as: "reviews", onDelete: "CASCADE", hooks: true });
Review.belongsTo(User, { foreignKey: "user_id", as: "User", onDelete: "CASCADE" });
Recipe.hasMany(Review, { foreignKey: "recipe_id", as: "reviews", onDelete: "CASCADE", hooks: true });
Review.belongsTo(Recipe, { foreignKey: "recipe_id", as: "Recipe", onDelete: "CASCADE" });

// Follow relationships
User.belongsToMany(User, {
  through: Follow,
  foreignKey: "follower_id",
  otherKey: "following_id",
  as: "following",
  onDelete: "CASCADE",
});
User.belongsToMany(User, {
  through: Follow,
  foreignKey: "following_id",
  otherKey: "follower_id",
  as: "followers",
  onDelete: "CASCADE",
});

// Activity relationships
User.hasMany(Activity, { foreignKey: "user_id", as: "activities", onDelete: "CASCADE", hooks: true });
Activity.belongsTo(User, { foreignKey: "user_id", as: "User", onDelete: "CASCADE" });

// Favorite relationships
Favorite.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
  onDelete: "CASCADE"
});

User.hasMany(Favorite, {
  foreignKey: "user_id",
  as: "favoriteRecipes",
  onDelete: "CASCADE"
});

Favorite.belongsTo(Recipe, {
  foreignKey: "recipe_id",
  as: "Recipe",
    onDelete: "CASCADE"
});

Recipe.hasMany(Favorite, {
  foreignKey: "recipe_id",
  as: "favorites",
  onDelete: "CASCADE"
});

module.exports = {
  User,
  Recipe,
  Favorite,
  Collection,
  CollectionRecipe,
  Rating,
  Review,
  Follow,
  Activity,
};
