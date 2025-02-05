// routes/quotationRoutes.js
const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");

// Route to create a quotation
router.post("/create", quotationController.createQuotation);

// Route to get all quotations (for admin or view purposes)
router.get("/", quotationController.getQuotations);
router.get(
  "/quotations/brand/:brandId",
  quotationController.getQuotationsByBrandId
);

module.exports = router;
