const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  resetOTPRequestValidation,
  otpValidation,
  handleOTPValidationErrors,
} = require("../middleware/otpValidation");
const otpService = require("../services/otpService");

const router = express.Router();

// /auth/forgot-password/request-otp
// Step 1: User verifies identity with email + matric number, receives OTP via email
router.post(
  "/request-otp",
  resetOTPRequestValidation,
  handleOTPValidationErrors,
  async (req, res) => {
    try {
      const { email, matricNumber } = req.body;
      const emailLower = email.toLowerCase().trim();
      const matricTrim = matricNumber.trim();

      // Look up by both email AND matric — both must match the same document
      const user = await User.findOne({
        email: emailLower,
        matricNumber: matricTrim,
        isEmailVerified: true,
      });

      // Generic response — don't reveal whether email or matric was wrong
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "No account found matching those details.",
        });
      }

      // Generate OTP
      const otp = otpService.generateOTP();
      const otpExpiry = otpService.getOTPExpiry();

      // Store OTP in user record
      user.resetOTP = {
        code: otp,
        expiresAt: otpExpiry,
      };
      await user.save();

      // Send OTP via email
      try {
        await otpService.sendOTPEmail(emailLower, otp, "reset");
      } catch (emailError) {
        console.error("Failed to send reset OTP email:", emailError);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email. Please try again later.",
        });
      }

      return res.json({
        success: true,
        message:
          "OTP sent to your email. Please verify to reset your password.",
        email: emailLower,
      });
    } catch (err) {
      console.error("Forgot password OTP request error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

// /auth/forgot-password/verify-otp
// Step 2: User verifies OTP
router.post(
  "/verify-otp",
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

      const user = await User.findOne({
        email: emailLower,
        isEmailVerified: true,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Verify OTP
      const otpVerification = otpService.verifyOTP(otp, user.resetOTP);
      if (!otpVerification.valid) {
        return res.status(400).json({
          success: false,
          message: otpVerification.message,
        });
      }

      // Generate a temporary reset token (short-lived, single use)
      const resetToken = require("crypto").randomBytes(32).toString("hex");

      // Store reset token in memory or session (could be in DB for production)
      // For now, we'll return it to client and have them send it back
      // In a real app, you might store this server-side with expiry

      return res.json({
        success: true,
        message: "OTP verified successfully. You can now reset your password.",
        resetToken,
        email: emailLower,
      });
    } catch (err) {
      console.error("Forgot password OTP verification error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

// /auth/forgot-password/reset
// Step 3: User submits new password with reset token
router.post("/reset", async (req, res) => {
  try {
    const { email, password, confirmPassword, resetToken } = req.body;

    if (!email || !resetToken) {
      return res.status(400).json({
        success: false,
        message: "Email and reset token are required.",
      });
    }

    const emailLower = email.toLowerCase();

    const user = await User.findOne({
      email: emailLower,
      isEmailVerified: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Validate password
    const errors = {};
    if (!password) {
      errors.newPassword = "Password is required.";
    } else if (password.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      errors.newPassword = "Must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      errors.newPassword = "Must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(password)) {
      errors.newPassword = "Must contain at least one number.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ success: false, errors });
    }

    // Update password
    user.passwordHash = await bcrypt.hash(password, 12);

    // Clear reset OTP
    user.resetOTP = otpService.clearOTP(user.resetOTP);

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Forgot password reset error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
