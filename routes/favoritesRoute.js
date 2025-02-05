// routes/favorites.js
const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");

// Add product to favorites
router.post("/add", favoritesController.addFavorite);

// Remove product from favorites
router.post("/remove", favoritesController.removeFavorite);

// Get all favorite products for a user
router.get("/:userId", favoritesController.getFavorites);

module.exports = router;
