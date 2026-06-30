const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "recipes",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000],
      },
    },
  },
  {
    tableName: "reviews",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Review;
