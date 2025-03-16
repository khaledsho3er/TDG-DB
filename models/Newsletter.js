const mongoose = require("mongoose");

const NewsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    subscribed: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now() },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Newsletter", NewsletterSchema);
