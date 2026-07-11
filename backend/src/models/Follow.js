const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Follow = sequelize.define(
  "Follow",
  {
    follower_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      primaryKey: true,
    },
    following_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      primaryKey: true,
    },
  },
  {
    tableName: "follows",
    validate: {
      notSelfFollow() {
        if (this.follower_id === this.following_id) {
          throw new Error("Cannot follow yourself");
        }
      },
    },
  },
);

module.exports = Follow;
