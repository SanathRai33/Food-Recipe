const Follow = require("../models/Follow");
const User = require("../models/User");
const Activity = require("../models/Activity");

const followUser = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (user_id === req.user.id) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Follow.findOne({
      where: { follower_id: req.user.id, following_id: user_id },
    });

    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const follow = await Follow.create({
      follower_id: req.user.id,
      following_id: user_id,
    });

    // Create activity
    await Activity.create({
      user_id: req.user.id,
      type: "followed_user",
      target_type: "user",
      target_id: user_id,
      data: {
        followed_username: user.username,
        followed_id: user_id,
      },
    });

    res.status(201).json({
      message: "Following user successfully",
      follow,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const follow = await Follow.findOne({
      where: { follower_id: req.user.id, following_id: user_id },
    });

    if (!follow) {
      return res.status(404).json({ message: "Not following this user" });
    }

    await follow.destroy();

    res.json({ message: "Unfollowed user successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const checkFollow = async (req, res) => {
  try {
    const { user_id } = req.params;

    const follow = await Follow.findOne({
      where: { follower_id: req.user.id, following_id: user_id },
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFollowers = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
      include: [
        {
          model: User,
          as: "followers",
          through: { attributes: [] },
          attributes: [
            "id",
            "username",
            "profile_picture",
            "first_name",
            "last_name",
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ followers: user.followers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
      include: [
        {
          model: User,
          as: "following",
          through: { attributes: [] },
          attributes: [
            "id",
            "username",
            "profile_picture",
            "first_name",
            "last_name",
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ following: user.following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
    followUser,
    unfollowUser,
    checkFollow,
    getFollowers,
    getFollowing
}