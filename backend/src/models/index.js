const User = require('./User');
const Recipe = require('./Recipe');
const Favorite = require('./Favorite');
const Collection = require('./Collection');
const CollectionRecipe = require('./CollectionRecipe');
const Rating = require('./Rating');
const Review = require('./Review');
const Follow = require('./Follow');
const Activity = require('./Activity');

// User - Recipe relationships
User.hasMany(Recipe, { foreignKey: 'user_id', as: 'recipes' });
Recipe.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// User - Favorite relationships
User.belongsToMany(Recipe, {
    through: Favorite,
    foreignKey: 'user_id',
    otherKey: 'recipe_id',
    as: 'favorites'
});
Recipe.belongsToMany(User, {
    through: Favorite,
    foreignKey: 'recipe_id',
    otherKey: 'user_id',
    as: 'favorited_by'
});

// User - Collection relationships
User.hasMany(Collection, { foreignKey: 'user_id', as: 'collections' });
Collection.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// Collection - Recipe relationships
Collection.belongsToMany(Recipe, {
    through: CollectionRecipe,
    foreignKey: 'collection_id',
    otherKey: 'recipe_id',
    as: 'recipes'
});
Recipe.belongsToMany(Collection, {
    through: CollectionRecipe,
    foreignKey: 'recipe_id',
    otherKey: 'collection_id',
    as: 'collections'
});

// User - Rating relationships
User.hasMany(Rating, { foreignKey: 'user_id', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Recipe.hasMany(Rating, { foreignKey: 'recipe_id', as: 'ratings' });
Rating.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'Recipe' });

// User - Review relationships
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
Recipe.hasMany(Review, { foreignKey: 'recipe_id', as: 'reviews' });
Review.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'Recipe' });

// Follow relationships
User.belongsToMany(User, {
    through: Follow,
    foreignKey: 'follower_id',
    otherKey: 'following_id',
    as: 'following'
});
User.belongsToMany(User, {
    through: Follow,
    foreignKey: 'following_id',
    otherKey: 'follower_id',
    as: 'followers'
});

// Activity relationships
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

// Favorite relationships
Favorite.belongsTo(User, {
    foreignKey: "user_id",
    as: "User",
});

User.hasMany(Favorite, {
    foreignKey: "user_id",
    as: "favoriteRecipes",
});

Favorite.belongsTo(Recipe, {
    foreignKey: "recipe_id",
    as: "Recipe",
});

Recipe.hasMany(Favorite, {
    foreignKey: "recipe_id",
    as: "favorites",
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
    Activity
};