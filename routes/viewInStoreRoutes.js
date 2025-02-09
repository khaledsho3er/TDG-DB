const express = require("express");
const router = express.Router();
const {
  createViewInStore,
  getAllViewInStore,
  getViewInStoreById,
  updateViewInStore,
  deleteViewInStore,
  getViewInStoreByBrandId,
} = require("../controllers/viewInStoreController");

// Create a new ViewInStore entry
router.post("/", createViewInStore);
//get by brand Id
router.get("/brand/:brandId", getViewInStoreByBrandId);

// Get all ViewInStore entries
router.get("/", getAllViewInStore);

// Get a single ViewInStore entry by ID
router.get("/:id", getViewInStoreById);

// Update a ViewInStore entry
router.put("/:id", updateViewInStore);

// Delete a ViewInStore entry
router.delete("/:id", deleteViewInStore);

module.exports = router;
