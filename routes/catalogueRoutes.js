const express = require("express");
const {
  addCatalogue,
  getCataloguesByVendor,
  getCatalogueById,
  updateCatalogue,
  deleteCatalogue,
  fetchCataloguesByVendor,
} = require("../controllers/catalogueController");
const upload = require("../middlewares/multerSetup");

const router = express.Router();

// Add a new catalogue
router.post(
  "/addCatalogue",
  upload.fields([
    { name: "image", maxCount: 1 }, // Accept one file for "image"
    { name: "pdf", maxCount: 1 }, // Accept one file for "pdf"
  ]),
  addCatalogue
);

// Get all catalogues for a specific vendor
router.get("/getCataloguesByVendor", getCataloguesByVendor);
router.get("/vendor/:vendorID", fetchCataloguesByVendor);

// Get a specific catalogue by ID
router.get("/:id", getCatalogueById);

// Update a specific catalogue
router.put("/:id", updateCatalogue);

// Delete a specific catalogue
router.delete("/:id", deleteCatalogue);
// router.get("/vendor/:vendorID", async (req, res) => {
//   try {
//     const { vendorID } = req.params;
//     const catalogs = await Catalogue.find({ vendorID });
//     res.status(200).json(catalogs);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Error fetching catalogs", details: error.message });
//   }
// });

module.exports = router;
