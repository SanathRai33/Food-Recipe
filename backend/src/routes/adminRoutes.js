const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { adminCheck } = require('../middleware/admin');

// All admin routes require authentication and admin privileges
router.use(authenticate);
router.use(adminCheck);

// Dashboard
router.get('/stats', adminController.getStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/make-admin', adminController.makeAdmin);
router.put('/users/:id/remove-admin', adminController.removeAdmin);

// Recipe Management
router.get('/recipes', adminController.getAllRecipes);
router.get('/recipes/:id', adminController.getRecipeById);
router.delete('/recipes/:id', adminController.deleteRecipe);
router.put('/recipes/:id/toggle-visibility', adminController.toggleRecipeVisibility);

module.exports = router;