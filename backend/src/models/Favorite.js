const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Favorite = sequelize.define(
  "Favorite",
  {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      primaryKey: true,
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "recipes",
        key: "id",
      },
      primaryKey: true,
    },
  },
  {
    tableName: "favorites",
  },
);

module.exports = Favorite;
