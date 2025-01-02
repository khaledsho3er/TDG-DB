const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now, // Automatically set the current date
    },
    status: {
      type: String,
      enum: ["Available", "Out of Stock"],
      default: "Available", // Default status is active
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps
);

module.exports = mongoose.model("Favorite", favoriteSchema);
