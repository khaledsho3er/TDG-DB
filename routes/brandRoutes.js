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

// Get all active brands - Move this BEFORE the /:id route
router.get("/active", brandController.getActiveBrands);

// Get brands by status
router.get("/status/:status", brandController.getBrandsByStatus);

// Get a single brand by ID - This should come AFTER more specific routes
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
router.put(
  "/admin/brands/:id",
  upload.fields([
    { name: "brandlogo", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  brandController.adminUpdateBrand
);

// Delete brand
router.delete("/admin/brands/:id", brandController.deleteBrand);

// Get types assigned to a brand
router.get("/:brandId/types", brandController.getBrandTypes);

module.exports = router;
