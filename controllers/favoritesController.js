// controllers/favoritesController.js
const User = require("../models/user");
const Product = require("../models/Products");

// Add a product to the user's favorites
exports.addFavorite = async (req, res) => {
  try {
    const { userSession, productId } = req.body;
    console.log("Adding to favorites:", userSession, productId);

    const user = await User.findById(userSession.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.favorites.push(productId);
    await user.save({ validateBeforeSave: false }); // Disable validation

    res.status(200).json({ message: "Favorite added" });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove a product from the user's favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { userSession, productId } = req.body;
    // Logic to remove the product from favorites
    const user = await User.findById(userSession.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== productId
    );
    await user.save();

    res.status(200).json({ message: "Favorite removed" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all favorite products for a user
exports.getFavorites = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: {
        path: "brandId", // <-- This will replace the brandId _id with the full Brand document
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
