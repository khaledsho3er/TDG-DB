const express = require("express");
const router = express.Router();
const productTagController = require("../controllers/productTagController");

router.post("/", productTagController.assignTagToProduct);
router.get("/:productId", productTagController.getTagsForProduct);
router.delete("/", productTagController.removeTagFromProduct);

module.exports = router;
