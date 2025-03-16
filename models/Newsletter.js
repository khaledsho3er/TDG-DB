const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    subscribed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Newsletter", NewsletterSchema);
