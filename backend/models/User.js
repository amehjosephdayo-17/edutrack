const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
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
    trim: true,
  },
  matricNumber: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
  },
  level: {
    type: String,
    enum: ["ND 1", "ND 2", "HND 1", "HND 2", ""],
    default: "",
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Prefer not to say", ""],
    default: "",
  },
  passwordHash: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  registrationOTP: {
    code: String,
    expiresAt: Date,
  },
  resetOTP: {
    code: String,
    expiresAt: Date,
  },
  tempRegistrationData: {
    fullName: String,
    phone: String,
    matricNumber: String,
    department: String,
    level: String,
    dateOfBirth: Date,
    gender: String,
    passwordHash: String,
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
