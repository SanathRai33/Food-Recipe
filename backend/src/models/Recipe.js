const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recipe = sequelize.define('Recipe', {
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
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            len: [3, 200]
        }
    },
    description: {
        type: DataTypes.TEXT
    },
    ingredients: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false
    },
    instructions: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false
    },
    prep_time: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    cook_time: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    total_time: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0
        }
    },
    servings: {
        type: DataTypes.INTEGER,
        validate: {
            min: 1
        }
    },
    difficulty: {
        type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
        defaultValue: 'Medium'
    },
    dietary_preferences: {
        type: DataTypes.ARRAY(DataTypes.STRING(50)),
        defaultValue: []
    },
    image_url: {
        type: DataTypes.STRING(255)
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'recipes',
    underscored: true,
    timestamps: true
});

module.exports = Recipe;