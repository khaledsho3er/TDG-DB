const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productsController");

const router = express.Router();

router.post("/addproduct", upload.array("images", 5), createProduct); // Limit to 5 images
router.get("/", getProducts);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
