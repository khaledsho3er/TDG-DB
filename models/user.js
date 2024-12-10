const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  address1: { type: String, required: false },
  address2: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other", // Default value
    required: false, // Optional field
  },
  language: { type: String, required: false },
  region: { type: String, required: false },
  shipmentAddress: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }, // Automatically set
});

// Automatically generate an ObjectId for `id` field, MongoDB does this by default
const User = mongoose.model("User", userSchema, "Users");

module.exports = User;
