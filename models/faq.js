const mongoose = require("mongoose");

const FAQSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      "General Questions",
      "Shopping and Orders",
      "Delivery and Returns",
      "For Brands",
      "For Designers",
      "Support and Assistance",
    ],
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("FAQ", FAQSchema);
