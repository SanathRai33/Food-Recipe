const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RecipeReview = sequelize.define('RecipeReview', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    recipe_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'recipes',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    review_content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 1000]
        }
    },
    is_edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'recipe_reviews',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'recipe_id']
        }
    ]
});

module.exports = RecipeReview;