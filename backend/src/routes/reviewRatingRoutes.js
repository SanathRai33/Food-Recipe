const express = require('express');
const router = express.Router();
const reviewRatingController = require('../controllers/reviewRatingController');
const { authenticate } = require('../middleware/auth');

// Get all reviews for a recipe (public)
router.get('/recipe/:recipeId', reviewRatingController.getRecipeReviews);

// Get current user's review for a recipe
router.get('/me/:recipeId', authenticate, reviewRatingController.getUserReview);

// Create or update review with rating
router.post('/:recipeId', authenticate, reviewRatingController.createOrUpdateReviewRating);

// Delete a review
router.delete('/:reviewId', authenticate, reviewRatingController.deleteReview);

module.exports = router;