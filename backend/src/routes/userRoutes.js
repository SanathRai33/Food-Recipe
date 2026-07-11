const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const validate = require("../utils/validation");

const { changePasswordValidation } = require("../validators/user.validator");

router.get("/profile", authenticate, userController.getProfile);

router.put("/profile", authenticate, userController.updateProfile);

router.put("/change-password", authenticate, changePasswordValidation, userController.changePassword,);

router.get("/my-recipes", authenticate, userController.getUserRecipes);

router.get("/:id", userController.getUserById);

router.get("/:id/favorites", userController.getUserFavorites);

router.get("/:id/recipes", userController.getProfileRecipes);

module.exports = router;
