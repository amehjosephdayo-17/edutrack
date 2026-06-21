const express = require("express");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

// /dashboard
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select(
      "-passwordHash",
    );
    if (!user) {
      req.session.destroy(() => {});
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        matricNumber: user.matricNumber,
        department: user.department,
        level: user.level,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
