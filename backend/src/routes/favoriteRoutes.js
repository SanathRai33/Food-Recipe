const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, favoriteController.getFavorites);
router.post('/', authenticate, favoriteController.addFavorite);
router.delete('/:recipe_id', authenticate, favoriteController.removeFavorite);
router.get('/check/:recipe_id', authenticate, favoriteController.checkFavorite);

module.exports = router;