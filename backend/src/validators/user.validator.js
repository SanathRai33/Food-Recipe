const { body } = require("express-validator");

const changePasswordValidation = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

module.exports = {
  changePasswordValidation,
};
