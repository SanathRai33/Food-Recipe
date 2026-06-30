const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', recipeController.getRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/', authenticate, upload.single('image'), recipeController.createRecipe);
router.put('/:id', authenticate, upload.single('image'), recipeController.updateRecipe);
router.delete('/:id', authenticate, recipeController.deleteRecipe);

module.exports = router;