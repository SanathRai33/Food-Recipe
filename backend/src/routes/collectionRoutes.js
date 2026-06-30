const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, collectionController.getCollections);
router.get('/:id', authenticate, collectionController.getCollectionById);
router.post('/', authenticate, collectionController.createCollection);
router.put('/:id', authenticate, collectionController.updateCollection);
router.delete('/:id', authenticate, collectionController.deleteCollection);

router.post('/:collectionId/recipes', authenticate, collectionController.addRecipeToCollection);
router.delete('/:collectionId/recipes/:recipeId', authenticate, collectionController.removeRecipeFromCollection);

module.exports = router;