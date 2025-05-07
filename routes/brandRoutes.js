const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const upload = require("../middlewares/brandMulterSetup");

// Create a new brand
router.post(
  "/brand",
  upload.fields([
    { name: "brandlogo", maxCount: 1 },
    { name: "digitalCopiesLogo", maxCount: 5 },
    { name: "coverPhoto", maxCount: 1 },
    { name: "catalogues", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  brandController.createBrand
);

// Get all brands
router.get("/", brandController.getAllBrands);

// Get a single brand by ID
router.get("/:id", brandController.getBrandById);

// Update a brand by ID
router.put(
  "/:id",
  upload.fields([
    { name: "brandlogo", maxCount: 1 },
    { name: "digitalCopiesLogo", maxCount: 5 },
    { name: "coverPhoto", maxCount: 1 },
    { name: "catalogues", maxCount: 10 },
    { name: "documents", maxCount: 10 },
  ]),
  brandController.updateBrand
);
router.put(
  "/:id/media",
  upload.fields([
    { name: "brandlogo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  brandController.updateBrandMedia
);

// Delete a brand by ID
router.delete("/:id", brandController.deleteBrand);
router.get("/status/:status", brandController.getBrandsByStatus);
router.put("/partners/:id/status", brandController.updateBrandStatus);
router.put(
  "/brands/:id/update-images",
  upload.fields([
    { name: "brandlogo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  brandController.updateBrandImages
);
router.get("/:id/financial", brandController.getBrandFinancialData);
// Update brand
router.put("/admin/brands/:id", brandController.updateBrand);

// Delete brand
router.delete("/admin/brands/:id", brandController.deleteBrand);

module.exports = router;
