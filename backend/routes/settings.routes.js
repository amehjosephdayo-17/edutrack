const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  profileUpdateValidation,
  passwordChangeValidation,
  handleValidationErrors,
} = require("../middleware/validate");

const router = express.Router();

// All settings routes require auth
router.use(requireAuth);

// /settings/profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select(
      "-passwordHash",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    return res.json({ success: true, user });
  } catch (err) {
    console.error("Settings GET error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// /settings/profile
router.patch(
  "/profile",
  profileUpdateValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { fullName, email, phone, department, level, dateOfBirth, gender } =
        req.body;

      // Check email uniqueness (exclude current user)
      const existing = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.session.userId },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          errors: { email: "This email address is already in use." },
        });
      }

      const updated = await User.findByIdAndUpdate(
        req.session.userId,
        {
          fullName,
          email: email.toLowerCase(),
          phone,
          department,
          level,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender || "",
        },
        { new: true, runValidators: true },
      ).select("-passwordHash");

      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      return res.json({
        success: true,
        message: "Profile updated successfully.",
        user: updated,
      });
    } catch (err) {
      console.error("Profile update error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

// /settings/password
router.post(
  "/password",
  passwordChangeValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, password } = req.body;

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          errors: { currentPassword: "Current password is incorrect." },
        });
      }

      const saltRounds = 12;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
      await user.save();

      // Invalidate current session to force re-login
      const userId = req.session.userId;
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy after password change:", err);
        }
      });

      return res.json({
        success: true,
        message: "Password changed successfully. Please log in again.",
        redirect: "/index.html",
      });
    } catch (err) {
      console.error("Password change error:", err);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  },
);

module.exports = router;
