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
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/make-admin', adminController.makeAdmin);
router.patch('/users/:id/remove-admin', adminController.removeAdmin);

// Recipe Management
router.get('/recipes', adminController.getAllRecipes);
router.get('/recipes/:id', adminController.getRecipeById);
router.delete('/recipes/:id', adminController.deleteRecipe);
router.patch('/recipes/:id/toggle-visibility', adminController.toggleRecipeVisibility);

module.exports = router;