const mongoose = require("mongoose");
const shippingSchema = new mongoose.Schema({
  address1: { type: String, required: true },
  address2: { type: String, required: false },
  label: { type: String, required: true },
  floor: { type: String, required: false },
  apartment: { type: String, required: false },
  landmark: { type: String, required: false },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }, // Flag to mark the default address
});
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Make optional for Google users
  phoneNumber: { type: String, required: false },
  dateOfBirth: { type: Date, required: false },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Prefer not to say"],
    default: "Other",
    required: false,
  },
  role: {
    type: String,
    enum: ["User", "Vendor"],
    default: "User",
  },
  language: { type: String, required: false },
  region: { type: String, required: false },
  shipmentAddress: [shippingSchema], // Embed shippingSchema
  createdAt: { type: Date, default: Date.now }, // Automatically set
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Add this line
  otp: { type: String },
  otpExpires: { type: Date },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
  resetToken: String, // 🔥 Add this field
  // Google authentication fields
  googleId: { type: String, unique: true, sparse: true },
  googleName: { type: String },
  googlePicture: { type: String },
  isGoogleUser: { type: Boolean, default: false },
  lastLogin: { type: Date, default: Date.now },
});

// Automatically generate an ObjectId for `id` field, MongoDB does this by default
const User = mongoose.model("User", userSchema, "Users");

module.exports = User;
