const Activity = require("../models/Activity");
const Follow = require("../models/Follow");
const { Op } = require("sequelize");

const getActivityFeed = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get users that the current user follows
    const following = await Follow.findAll({
      where: { follower_id: req.user.id },
      attributes: ["following_id"],
    });

    const followingIds = following.map((f) => f.following_id);
    followingIds.push(req.user.id); // Include own activities

    const activities = await Activity.findAll({
      where: {
        user_id: { [Op.in]: followingIds },
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: [
            "id",
            "username",
            "profile_picture",
            "first_name",
            "last_name",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Activity.count({
      where: {
        user_id: { [Op.in]: followingIds },
      },
    });

    res.json({
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMyActivities = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const activities = await Activity.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Activity.count({
      where: { user_id: req.user.id },
    });

    res.json({
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const activities = await Activity.findAll({
      where: { user_id: userId },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "profile_picture"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const total = await Activity.count({
      where: { user_id: userId },
    });

    res.json({
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMyActivities,
  getUserActivities,
  getActivityFeed,
};
