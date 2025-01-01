const mongoose = require("mongoose");

// Enum for policy types
const policyTypes = [
  "Full Terms of Service Agreement",
  "Cookie Policy",
  "Privacy Policy",
  "Returns & Exchanges Policy",
  "Payment Policy",
  "Shipping Policy",
  "Security Policy",
  "Compliance Policy",
];

// Sub-subtitle schema (for nested content under subtitles)
const subSubsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

// Subtitle schema (this can have multiple sub-subtitles)
const subsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  subSubsections: [subSubsectionSchema], // Nested sub-subsections
});

// Policy schema (with type, title, and an array of subtitles)
const policySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: policyTypes,
    required: true,
  },
  title: { type: String, required: true }, // The main title of the policy
  subtitles: [subsectionSchema], // List of subtitles and their contents
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Policy = mongoose.model("Policy", policySchema);
module.exports = Policy;
