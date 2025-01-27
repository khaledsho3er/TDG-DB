const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const upload = require("../middlewares/multerSetup");

router.post(
  "/brand",
  upload.fields([
    { name: "digitalCopiesLogo", maxCount: 5 }, // Multiple logos
    { name: "catalogues", maxCount: 10 }, // Multiple catalogs
    { name: "coverPhoto", maxCount: 1 }, // Single cover photo
  ]),
  brandController.createBrand
);

router.get("/brand", brandController.getAllBrands);
router.get("/brand/:id", brandController.getBrandById);

router.put(
  "/brand/:id/upload-images",
  upload.fields([
    { name: "digitalCopiesLogo", maxCount: 5 }, // Multiple logos
    { name: "catalogues", maxCount: 10 }, // Multiple catalogs
  ]),
  brandController.updateBrandImages
);

router.put("/brand/:id", brandController.updateBrand);
router.delete("/brand/:id", brandController.deleteBrand);

module.exports = router;
