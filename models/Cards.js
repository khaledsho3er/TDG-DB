const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardNumber: { type: String, required: true }, // Store hashed/encrypted card numbers
  cardType: {
    type: String,
    enum: ["Visa", "MasterCard", "Amex", "Discover"],
    required: true,
  },
  expiryDate: { type: String, required: true }, // Format: MM/YY
  default: { type: Boolean, default: false },
});

module.exports = mongoose.model("Card", CardSchema);
