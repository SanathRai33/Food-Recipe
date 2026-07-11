const { body } = require('express-validator');

const createRecipeValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    
    body('ingredients')
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    throw new Error('Ingredients must be a valid JSON array');
                }
            }
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error('Ingredients must be a non-empty array');
            }
            return true;
        }),
    
    body('instructions')
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    throw new Error('Instructions must be a valid JSON array');
                }
            }
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error('Instructions must be a non-empty array');
            }
            return true;
        }),
    
    body('prep_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Prep time must be a positive number'),
    
    body('cook_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Cook time must be a positive number'),
    
    body('servings')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Servings must be at least 1'),
    
    body('difficulty')
        .optional()
        .isIn(['Easy', 'Medium', 'Hard'])
        .withMessage('Difficulty must be Easy, Medium, or Hard'),
    
    body('dietary_preferences')
        .optional()
        .isArray()
        .withMessage('Dietary preferences must be an array'),
    
    body('is_public')
        .optional()
        .isBoolean()
        .withMessage('is_public must be a boolean')
];

const updateRecipeValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    
    body('ingredients')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    throw new Error('Ingredients must be a valid JSON array');
                }
            }
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error('Ingredients must be a non-empty array');
            }
            return true;
        }),
    
    body('instructions')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    throw new Error('Instructions must be a valid JSON array');
                }
            }
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error('Instructions must be a non-empty array');
            }
            return true;
        }),
    
    body('prep_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Prep time must be a positive number'),
    
    body('cook_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Cook time must be a positive number'),
    
    body('servings')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Servings must be at least 1'),
    
    body('difficulty')
        .optional()
        .isIn(['Easy', 'Medium', 'Hard'])
        .withMessage('Difficulty must be Easy, Medium, or Hard'),
    
    body('dietary_preferences')
        .optional()
        .isArray()
        .withMessage('Dietary preferences must be an array'),
    
    body('is_public')
        .optional()
        .isBoolean()
        .withMessage('is_public must be a boolean')
];

module.exports = {
    createRecipeValidation,
    updateRecipeValidation
};