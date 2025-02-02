const express = require("express");
const vendorController = require("../controllers/vendorController");


const router = express.Router();

router.post("/signup", vendorController.signup);
router.post("/login", vendorController.login);
router.post("/logout", vendorController.logout);
router.get("/", vendorController.getAllVendors);
router.get("/:id", vendorController.getVendorById);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);
router.get("/vendors/byBrand/:brandId", vendorController.getVendorsByBrand);
router.put('/update-brandid', vendorController.updateByEmailAndPassword);


module.exports = router;
