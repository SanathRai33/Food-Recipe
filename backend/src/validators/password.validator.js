const { body } = require('express-validator');

const forgotPasswordValidation = [
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
];

const resetPasswordValidation = [
    body('token')
        .notEmpty()
        .withMessage('Token is required'),
    
    body('new_password')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
    
    body('confirm_password')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

const changePasswordValidation = [
    body('current_password')
        .notEmpty()
        .withMessage('Current password is required'),
    
    body('new_password')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
    
    body('confirm_password')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

module.exports = {
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation
};