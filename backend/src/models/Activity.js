const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Activity = sequelize.define(
  "Activity",
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [
          [
            "created_recipe",
            "reviewed_recipe",
            "rated_recipe",
            "favorited_recipe",
            "followed_user",
          ],
        ],
      },
    },
    target_type: {
      type: DataTypes.STRING(50),
    },
    target_id: {
      type: DataTypes.UUID,
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    tableName: "activities",
    underscored: true,
    timestamps: true,
  },
);

module.exports = Activity;
