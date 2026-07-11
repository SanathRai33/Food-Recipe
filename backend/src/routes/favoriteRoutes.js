const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

// Get all favorites for current user
router.get('/', authenticate, favoriteController.getFavorites);

// Add favorite (POST)
router.post('/', authenticate, favoriteController.addFavorite);

// Check if recipe is favorited
router.get('/check/:recipe_id', authenticate, favoriteController.checkFavorite);

// Remove favorite (DELETE) - use params consistently
router.delete('/:recipe_id', authenticate, favoriteController.removeFavorite);

module.exports = router;