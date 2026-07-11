const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { registerValidation, loginValidation } = require("../validators/auth.validator");
const { authLimiter } = require("../middleware/rateLimiter");

// Auth routes with rate limiting
router.post("/register", authLimiter, registerValidation, authController.register);

router.post("/login", authLimiter, loginValidation, authController.login);

router.post("/refresh-token", authLimiter, authController.refreshToken);

router.post("/logout", authenticate, authController.logout);

router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;