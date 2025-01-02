const Favorite = require("../models/favorites");
// const Product = require("../models/product"); // Assuming you have a product model

// POST - Create a favorite for the logged-in user
exports.createFavorite = async (req, res) => {
  const { productId, status } = req.body; // Getting productId and status from request body
  const userId = req.user._id; // User ID from the auth middleware

  try {
    // Check if the favorite already exists
    const existingFavorite = await Favorite.findOne({ userId, productId });

    if (existingFavorite) {
      return res
        .status(400)
        .json({ message: "Product is already in favorites" });
    }

    // Create and save the new favorite
    const newFavorite = new Favorite({ userId, productId, status });
    await newFavorite.save();

    res.status(201).json({ message: "Favorite added", newFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating favorite", error });
  }
};

// GET - Get all favorites for a specific user
// exports.getFavoritesByUserId = async (req, res) => {
//   const userId = req.user._id; // Get user ID from the auth middleware

//   try {
//     // Find favorites by userId and populate product details
//     const favorites = await Favorite.find({ userId })
//       .populate("productId", "title price image status")
//       .sort({ date: -1 }); // Sort by most recent

//     if (favorites.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No favorites found for this user" });
//     }

//     res.status(200).json({ favorites });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error fetching favorites", error });
//   }
// };
// Fetch all favorite products for a specific user
exports.getFavoritesByUserId = async (req, res) => {
  try {
    const userId = req.user.id.trim(); // Trim any extra whitespace or newlines

    // Check if the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const favorites = await Favorite.find({ userId })
      .populate("productId", "title price image status") // Populate product details
      .exec();

    if (!favorites) {
      return res
        .status(404)
        .json({ message: "No favorites found for this user" });
    }

    res.status(200).json({ favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching favorites" });
  }
};
// PUT - Update a favorite
exports.updateFavorite = async (req, res) => {
  const { id } = req.params; // Favorite ID
  const { status } = req.body; // New status

  try {
    // Find and update the favorite
    const updatedFavorite = await Favorite.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("productId", "title price image status");

    if (!updatedFavorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Favorite updated", updatedFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating favorite", error });
  }
};

// DELETE - Delete a favorite
exports.deleteFavorite = async (req, res) => {
  const { id } = req.params; // Favorite ID

  try {
    // Find and delete the favorite
    const deletedFavorite = await Favorite.findByIdAndDelete(id);

    if (!deletedFavorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Favorite deleted", deletedFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting favorite", error });
  }
};

// GET - Get all favorites (admin use, if required)
exports.getAllFavorites = async (req, res) => {
  try {
    const allFavorites = await Favorite.find()
      .populate("productId", "title price image status")
      .sort({ date: -1 }); // Sort by most recent

    res.status(200).json({ allFavorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching all favorites", error });
  }
};

// GET - Get a specific favorite by ID
exports.getFavoriteById = async (req, res) => {
  const { id } = req.params;

  try {
    const favorite = await Favorite.findById(id).populate(
      "productId",
      "title price image status"
    );

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching favorite", error });
  }
};
