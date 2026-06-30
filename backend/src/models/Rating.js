const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rating = sequelize.define('Rating', {
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
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
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    }
}, {
    tableName: 'ratings',
    underscored: true,
    timestamps: true
});

module.exports = Rating;