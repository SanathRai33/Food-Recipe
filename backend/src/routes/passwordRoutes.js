const express = require("express");
const router = express.Router();
const passwordController = require("../controllers/passwordController");
const { passwordResetLimiter } = require("../middleware/rateLimiter");
const {
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/password.validator");
const { validate } = require("../utils/validation");

router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  passwordController.forgotPassword,
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  resetPasswordValidation,
  validate,
  passwordController.resetPassword,
);

router.get("/validate-token/:token", passwordController.validateResetToken);

module.exports = router;
