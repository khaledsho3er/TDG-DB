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
  isDefault: { type: Boolean, default: false },
});

const googleUserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  googleName: { type: String },
  googlePicture: { type: String },
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
    enum: ["GoogleUser"],
    default: "GoogleUser",
  },
  language: { type: String, required: false },
  region: { type: String, required: false },
  shipmentAddress: [shippingSchema],
  createdAt: { type: Date, default: Date.now },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
  lastLogin: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GoogleUser", googleUserSchema, "GoogleUsers");
