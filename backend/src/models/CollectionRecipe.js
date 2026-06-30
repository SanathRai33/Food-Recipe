const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CollectionRecipe = sequelize.define('CollectionRecipe', {
    collection_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'collections',
            key: 'id'
        },
        primaryKey: true
    },
    recipe_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'recipes',
            key: 'id'
        },
        primaryKey: true
    },
    added_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'collection_recipes',
    underscored: true,
    timestamps: false
});

module.exports = CollectionRecipe;