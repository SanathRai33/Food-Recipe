const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

router.get('/recipe/:recipeId', ratingController.getRecipeRatings);
router.post('/:recipeId', authenticate, ratingController.createOrUpdateRating);
router.get('/me/:recipeId', authenticate, ratingController.getUserRating);

module.exports = router;