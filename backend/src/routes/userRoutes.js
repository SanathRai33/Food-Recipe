const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const validate = require("../utils/validation");

const { changePasswordValidation } = require("../validators/user.validator");

router.get("/profile", authenticate, userController.getProfile);

router.put("/profile", authenticate, userController.updateProfile);

router.put("/change-password", authenticate, changePasswordValidation, userController.changePassword,);

router.get("/:id", userController.getUserById);

router.get("/:id/recipes", userController.getUserRecipes);

router.get("/:id/favorites", userController.getUserFavorites);

module.exports = router;
