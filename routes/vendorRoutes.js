const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const upload = require("../middlewares/multerSetup");

router.post(
  "/vendor",
  upload.fields([
    { name: "digitalCopiesLogo", maxCount: 5 }, // Multiple logos
    { name: "catalogues", maxCount: 10 }, // Multiple catalogs
    { name: "coverPhoto", maxCount: 1 }, // Single cover photo
  ]),
  vendorController.createVendor
);

router.get("/vendor", vendorController.getAllVendors);
router.get("/vendor/:id", vendorController.getVendorById);

router.put(
  "/vendor/:id/upload-images",
  upload.fields([
    { name: "digitalCopiesLogo", maxCount: 5 }, // Multiple logos
    { name: "catalogues", maxCount: 10 }, // Multiple catalogs
  ]),
  vendorController.updateVendorImages
);

router.put("/vendor/:id", vendorController.updateVendor);
router.delete("/vendor/:id", vendorController.deleteVendor);

module.exports = router;
