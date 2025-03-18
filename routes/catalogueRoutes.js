const express = require("express");
const upload = require("../middlewares/catalogsUpload");
const {
  createCatalog,
  getCatalogs,
  deleteCatalog,
} = require("../controllers/catalogueController");

const router = express.Router();

router.post(
  "/upload",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  createCatalog
);
router.get("/:brandId", getCatalogs);
router.delete("/:id", deleteCatalog);

module.exports = router;
