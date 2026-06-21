const { body, validationResult } = require("express-validator");

// Allowed level values
const ALLOWED_LEVELS = ["100L", "200L", "300L", "400L", "500L", "600L"];

// Matric number pattern — alphanumeric with optional slashes/dashes
// e.g. CSC/2020/001, 2020/12345, ENG-2021-002
const MATRIC_PATTERN = /^[A-Za-z0-9\-\/]{4,20}$/;

// ─── Reusable field rules ───────────────────────────────────────────────────

const fullNameRules = body("fullName")
  .trim()
  .notEmpty()
  .withMessage("Full name is required.")
  .matches(/^[A-Za-z\s\-]{2,60}$/)
  .withMessage(
    "Full name must be 2–60 characters (letters, spaces, hyphens only).",
  );

const emailRules = body("email")
  .trim()
  .notEmpty()
  .withMessage("Email is required.")
  .isEmail()
  .withMessage("Enter a valid email address.")
  .normalizeEmail();

const phoneRules = body("phone")
  .trim()
  .notEmpty()
  .withMessage("Phone number is required.")
  .matches(/^\+?[0-9]{10,14}$/)
  .withMessage(
    "Enter a valid phone number (10–14 digits, optional leading +).",
  );

const matricRules = body("matricNumber")
  .trim()
  .notEmpty()
  .withMessage("Matric/Student ID is required.")
  .matches(MATRIC_PATTERN)
  .withMessage(
    "Matric number must be 4–20 alphanumeric characters (slashes/dashes allowed).",
  );

const departmentRules = body("department")
  .trim()
  .notEmpty()
  .withMessage("Department is required.");

const levelRules = body("level")
  .trim()
  .notEmpty()
  .withMessage("Level is required.")
  .isIn(ALLOWED_LEVELS)
  .withMessage(`Level must be one of: ${ALLOWED_LEVELS.join(", ")}.`);

const dateOfBirthRules = body("dateOfBirth")
  .notEmpty()
  .withMessage("Date of birth is required.")
  .isDate()
  .withMessage("Enter a valid date of birth.")
  .custom((value) => {
    const dob = new Date(value);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 14 || age > 80) {
      throw new Error("Age must be between 14 and 80 years.");
    }
    return true;
  });

const passwordRules = body("password")
  .notEmpty()
  .withMessage("Password is required.")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.");

const confirmPasswordRules = body("confirmPassword")
  .notEmpty()
  .withMessage("Please confirm your password.")
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }
    return true;
  });

// ─── Validation chains ──────────────────────────────────────────────────────

const registerValidation = [
  fullNameRules,
  emailRules,
  phoneRules,
  matricRules,
  departmentRules,
  levelRules,
  dateOfBirthRules,
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Prefer not to say", ""])
    .withMessage("Invalid gender value."),
  passwordRules,
  confirmPasswordRules,
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

const profileUpdateValidation = [
  fullNameRules,
  emailRules,
  phoneRules,
  departmentRules,
  levelRules,
  dateOfBirthRules,
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Prefer not to say", ""])
    .withMessage("Invalid gender value."),
];

const passwordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required."),
  passwordRules.withMessage !== undefined
    ? passwordRules
    : body("password")
        .notEmpty()
        .withMessage("New password is required.")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters.")
        .matches(/[A-Z]/)
        .withMessage("New password must contain at least one uppercase letter.")
        .matches(/[a-z]/)
        .withMessage("New password must contain at least one lowercase letter.")
        .matches(/[0-9]/)
        .withMessage("New password must contain at least one number."),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Please confirm your new password.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
];

// ─── Result handler ─────────────────────────────────────────────────────────

/**
 * Middleware that reads express-validator results and returns 422 with
 * field-keyed errors if any exist.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach((err) => {
      if (!fieldErrors[err.path]) {
        fieldErrors[err.path] = err.msg;
      }
    });
    return res.status(422).json({ success: false, errors: fieldErrors });
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  passwordChangeValidation,
  handleValidationErrors,
};
