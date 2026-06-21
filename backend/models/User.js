const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  matricNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  level: {
    type: String,
    required: true,
    enum: ["ND 1", "ND 2", "HND 1", "HND 2"],
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Prefer not to say", ""],
    default: "",
  },
  passwordHash: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
