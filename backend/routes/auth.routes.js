const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");
const {
  loginValidation,
  handleValidationErrors,
} = require("../middleware/validate");
const {
  registrationOTPRequestValidation,
  otpValidation,
  handleOTPValidationErrors,
} = require("../middleware/otpValidation");
const otpService = require("../services/otpService");

const router = express.Router();

// Generated once at startup — timing-safe dummy for login when email not found
const DUMMY_HASH = bcrypt.hashSync("timing-safe-dummy-password", 12);

router.get("/me", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ loggedIn: true });
  }
  return res.json({ loggedIn: false });
});

router.post(
  "/register/request-otp",
  registerLimiter,
  registrationOTPRequestValidation,
  handleOTPValidationErrors,
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        matricNumber,
        department,
        level,
        dateOfBirth,
        gender,
        password,
      } = req.body;

      const emailLower = email.toLowerCase();

      const existingEmail = await User.findOne({ email: emailLower });
      if (existingEmail && existingEmail.isEmailVerified) {
        return res.status(409).json({
          success: false,
          errors: { email: "This email address is already registered." },
        });
      }

      const existingMatric = await User.findOne({
        matricNumber,
        isEmailVerified: true,
      });
      if (existingMatric) {
        return res.status(409).json({
          success: false,
          errors: {
            matricNumber: "This matric/student ID is already registered.",
          },
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      // Generate OTP
      const otp = otpService.generateOTP();
      const otpExpiry = otpService.getOTPExpiry();

      let user = existingEmail;
      if (!user) {
        user = new User({
          email: emailLower,
          isEmailVerified: false,
        });
      }

      // Store OTP and temporary registration data
      user.registrationOTP = {
        code: otp,
        expiresAt: otpExpiry,
      };
      user.tempRegistrationData = {
        fullName,
        phone,
        matricNumber,
        department,
        level,
        dateOfBirth: new Date(dateOfBirth),
        gender: gender || "",
        passwordHash,
      };

      await user.save();

      // Send OTP via email
      try {
        await otpService.sendOTPEmail(emailLower, otp, "registration");
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again later.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "OTP sent to your email. Please verify to complete registration.",
        email: emailLower,
      });
    } catch (err) {
      console.error("Register OTP request error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error. Please try again." });
    }
  },
);

router.post(
  "/register/verify-otp",
  registerLimiter,
  otpValidation,
  handleOTPValidationErrors,
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const emailLower = email.toLowerCase();

      if (!emailLower) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      const user = await User.findOne({ email: emailLower });
      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found. Please complete registration request first.",
        });
      }

      // Verify OTP
      const otpVerification = otpService.verifyOTP(otp, user.registrationOTP);
      if (!otpVerification.valid) {
        return res.status(400).json({
          success: false,
          message: otpVerification.message,
        });
      }

      // Apply temporary registration data to user
      if (user.tempRegistrationData) {
        user.fullName = user.tempRegistrationData.fullName;
        user.phone = user.tempRegistrationData.phone;
        user.matricNumber = user.tempRegistrationData.matricNumber;
        user.department = user.tempRegistrationData.department;
        user.level = user.tempRegistrationData.level;
        user.dateOfBirth = user.tempRegistrationData.dateOfBirth;
        user.gender = user.tempRegistrationData.gender;
        user.passwordHash = user.tempRegistrationData.passwordHash;
      }

      // Clear OTP and temporary data
      user.registrationOTP = otpService.clearOTP(user.registrationOTP);
      user.tempRegistrationData = undefined;
      user.isEmailVerified = true;

      await user.save();

      return res.status(201).json({
        success: true,
        message: "Registration successful! You can now log in.",
      });
    } catch (err) {
      console.error("Register OTP verification error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error. Please try again." });
    }
  },
);

router.post(
  "/login",
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      const genericError = "Invalid email or password.";

      const user = await User.findOne({ email: email.toLowerCase() });

      // Always run bcrypt compare to prevent timing attacks
      const hashToCompare =
        user && user.passwordHash ? user.passwordHash : DUMMY_HASH;
      const isMatch = await bcrypt.compare(password, hashToCompare);

      if (!user || !isMatch || !user.isEmailVerified) {
        return res.status(401).json({ success: false, message: genericError });
      }

      // Set session duration based on Remember me
      if (rememberMe) {
        req.session.cookie.maxAge =
          parseInt(process.env.REMEMBER_ME_MAX_AGE_MS) || 2592000000;
      } else {
        req.session.cookie.maxAge =
          parseInt(process.env.SESSION_MAX_AGE_MS) || 1800000;
      }

      req.session.userId = user._id.toString();

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return res.json({
        success: true,
        message: "Login successful.",
        redirect: "/dashboard.html",
      });
    } catch (err) {
      console.error("Login error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error. Please try again." });
    }
  },
);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Logout failed." });
    }
    res.clearCookie("connect.sid");
    return res.json({ success: true, redirect: "/index.html" });
  });
});

module.exports = router;
