const crypto = require("crypto");
const { Op } = require("sequelize");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const { sendPasswordResetEmail } = require("../utils/email");
const { ApiResponse, sendResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const sequelize = require("../config/database");

const forgotPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email },
      transaction,
    });

    if (!user) {
      const response = ApiResponse.error(
        "User not found with this email",
        null,
        404,
      );
      return sendResponse(res, response);
    }

    if (user.is_banned) {
      const response = ApiResponse.error(
        "Your account has been banned. Please contact support.",
        null,
        403,
      );
      return sendResponse(res, response);
    }

    await PasswordReset.destroy({
      where: {
        user_id: user.id,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      transaction,
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await PasswordReset.create(
      {
        user_id: user.id,
        token,
        expires_at: expiresAt,
        used: false,
      },
      { transaction },
    );

    await transaction.commit();

    await sendPasswordResetEmail(email, token, user.username);

    const response = ApiResponse.success(
      "Password reset link sent to your email. Please check your inbox.",
    );
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Forgot password error:", error);
    const response = ApiResponse.error(
      "Failed to process request. Please try again.",
      null,
      500,
    );
    return sendResponse(res, response);
  }
};

const resetPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { token, new_password } = req.body;

    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      transaction,
    });

    if (!resetRecord) {
      const response = ApiResponse.error(
        "Invalid or expired token. Please request a new password reset.",
        null,
        400,
      );
      return sendResponse(res, response);
    }

    const user = await User.findByPk(resetRecord.user_id, { transaction });

    if (!user) {
      const response = ApiResponse.error("User not found", null, 404);
      return sendResponse(res, response);
    }

    user.password_hash = new_password;
    await user.save({ transaction });

    resetRecord.used = true;
    await resetRecord.save({ transaction });

    await PasswordReset.destroy({
      where: {
        user_id: user.id,
        used: true,
        id: { [Op.ne]: resetRecord.id },
      },
      transaction,
    });

    await transaction.commit();

    const response = ApiResponse.success(
      "Password reset successfully. You can now login with your new password.",
    );
    return sendResponse(res, response);
  } catch (error) {
    await transaction.rollback();
    logger.error("Reset password error:", error);
    const response = ApiResponse.error(
      "Failed to reset password. Please try again.",
      null,
      500,
    );
    return sendResponse(res, response);
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!resetRecord) {
      const response = ApiResponse.error("Invalid or expired token", null, 400);
      return sendResponse(res, response);
    }

    const response = ApiResponse.success("Token is valid");
    return sendResponse(res, response);
  } catch (error) {
    logger.error("Validate token error:", error);
    const response = ApiResponse.error("Failed to validate token", null, 500);
    return sendResponse(res, response);
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  validateResetToken,
};
