const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesControllers");
const authMiddleware = require("../middlewares/authMiddleware"); // Ensure this middleware gets user info from the token

// Create a favorite for the logged-in user
router.post("/", authMiddleware, favoritesController.createFavorite);

// Get all favorites for the logged-in user
router.get("/", authMiddleware, favoritesController.getFavoritesByUserId);

// Get a specific favorite by its ID
router.get("/:id", authMiddleware, favoritesController.getFavoriteById);

// Update a favorite by its ID (status change, etc.)
router.put("/:id", authMiddleware, favoritesController.updateFavorite);

// Delete a specific favorite by its ID
router.delete("/:id", authMiddleware, favoritesController.deleteFavorite);

// Admin: Get all favorites (optional)
router.get("/all", authMiddleware, favoritesController.getAllFavorites);

module.exports = router;
