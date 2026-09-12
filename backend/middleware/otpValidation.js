const { body, validationResult } = require("express-validator");

/**
 * Validation rules for OTP
 */
const otpValidation = [
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits.")
    .isNumeric()
    .withMessage("OTP must contain only numbers."),
];

/**
 * Validation rules for registration request (initial submission)
 */
const registrationOTPRequestValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required.")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters."),
  body("matricNumber")
    .trim()
    .notEmpty()
    .withMessage("Matric number is required.")
    .isLength({ min: 5, max: 20 })
    .withMessage("Matric number must be between 5 and 20 characters."),
  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required."),
  body("level")
    .trim()
    .notEmpty()
    .withMessage("Level is required.")
    .isIn(["ND 1", "ND 2", "HND 1", "HND 2"])
    .withMessage("Invalid level selection."),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required.")
    .isISO8601()
    .withMessage("Date of birth must be a valid date."),
  body("gender")
    .optional()
    .trim()
    .isIn(["Male", "Female", "Prefer not to say", ""])
    .withMessage("Invalid gender selection."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number."),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required.")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match."),
];

/**
 * Validation rules for password reset OTP request
 */
const resetOTPRequestValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("matricNumber")
    .trim()
    .notEmpty()
    .withMessage("Matric number is required."),
];

/**
 * Middleware to handle validation errors
 */
const handleOTPValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach((error) => {
      if (!formattedErrors[error.param]) {
        formattedErrors[error.param] = error.msg;
      }
    });
    return res.status(422).json({
      success: false,
      errors: formattedErrors,
    });
  }
  next();
};

module.exports = {
  otpValidation,
  registrationOTPRequestValidation,
  resetOTPRequestValidation,
  handleOTPValidationErrors,
};
