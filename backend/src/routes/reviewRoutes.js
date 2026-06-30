const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.get('/recipe/:recipeId', reviewController.getReviewsByRecipe);
router.post('/:recipeId', authenticate, reviewController.createReview);
router.put('/:reviewId', authenticate, reviewController.updateReview);
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;