const Follow = require("../models/Follow");
const User = require("../models/User");
const Activity = require("../models/Activity");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const sequelize = require("../config/database");

const followUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { user_id } = req.body;

    if (user_id === req.user.id) {
      const response = ApiResponse.error("Cannot follow yourself", null, 400);
      return sendResponse(res, response);
    }

    const user = await User.findByPk(user_id, { transaction });
    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    // Check if target user is banned
    if (user.is_banned) {
      const response = ApiResponse.error("Cannot follow - user is banned", null, 403);
      return sendResponse(res, response);
    }

    // Check if current user is banned
    const currentUser = await User.findByPk(req.user.id, { transaction });
    if (currentUser && currentUser.is_banned) {
      const response = ApiResponse.error("Cannot follow - your account is banned", null, 403);
      return sendResponse(res, response);
    }

    const existing = await Follow.findOne({
      where: { 
        follower_id: req.user.id, 
        following_id: user_id 
      },
      transaction
    });

    if (existing) {
      const response = ApiResponse.error("Already following this user", null, 400);
      return sendResponse(res, response);
    }

    const follow = await Follow.create({
      follower_id: req.user.id,
      following_id: user_id,
    }, { transaction });

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
    }, { transaction });

    await transaction.commit();

    const response = ApiResponse.success("Following user successfully", follow);
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Follow user error:", error);
    const response = ApiResponse.error("Failed to follow user", null, 500);
    return sendResponse(res, response);
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const follow = await Follow.findOne({
      where: { 
        follower_id: req.user.id, 
        following_id: user_id 
      },
    });

    if (!follow) {
      const response = ApiResponse.error("Not following this user", null, 404);
      return sendResponse(res, response);
    }

    await follow.destroy();

    const response = ApiResponse.success("Unfollowed user successfully");
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Unfollow user error:", error);
    const response = ApiResponse.error("Failed to unfollow user", null, 500);
    return sendResponse(res, response);
  }
};

const checkFollow = async (req, res) => {
  try {
    const { user_id } = req.params;

    const follow = await Follow.findOne({
      where: { 
        follower_id: req.user.id, 
        following_id: user_id 
      },
    });

    const response = ApiResponse.success("Follow check completed", { 
      isFollowing: !!follow 
    });
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Check follow error:", error);
    const response = ApiResponse.error("Failed to check follow status", null, 500);
    return sendResponse(res, response);
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
            "is_banned"
          ],
        },
      ],
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    // Filter out banned users from followers
    const followers = user.followers.filter(f => !f.is_banned);

    const response = ApiResponse.success("Followers fetched successfully", followers);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get followers error:", error);
    const response = ApiResponse.error("Failed to fetch followers", null, 500);
    return sendResponse(res, response);
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
            "is_banned"
          ],
        },
      ],
    });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    // Filter out banned users from following
    const following = user.following.filter(f => !f.is_banned);

    const response = ApiResponse.success("Following fetched successfully", following);
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Get following error:", error);
    const response = ApiResponse.error("Failed to fetch following", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  followUser,
  unfollowUser,
  checkFollow,
  getFollowers,
  getFollowing,
};