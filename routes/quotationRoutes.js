// routes/quotationRoutes.js
const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");
const uploadFile = require("../middlewares/multerFiles");

// Route to create a quotation
router.post("/create", quotationController.createQuotation);

// Route to get all quotations (for admin or view purposes)
router.get("/", quotationController.getQuotations);
router.get(
  "/quotations/brand/:brandId",
  quotationController.getQuotationsByBrandId
);
router.get("/customer/:userId", quotationController.getQuotationsByUserId);

router.get("/:id", quotationController.getQuotationById);
// Update by vendor
router.put(
  "/update/:id",
  uploadFile.single("file"),
  quotationController.updateQuotationByVendor
);
// Delete
router.delete("/delete/:id", quotationController.deleteQuotation);
router.patch(
  "/quotation/:id/client-approval",
  quotationController.toggleClientApproval
);
router.patch(
  "/quotation/:id/vendor-approval",
  quotationController.vendorApproveQuotation
);

module.exports = router;
