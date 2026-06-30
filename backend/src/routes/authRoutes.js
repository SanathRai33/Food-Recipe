const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { registerValidation, loginValidation } = require("../validators/auth.validator");

router.post("/register", registerValidation, authController.register);

router.post("/login", loginValidation, authController.login);

router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
