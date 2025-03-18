const express = require("express");
const upload = require("../middlewares/catalogsUpload");
const {
  createCatalog,
  getCatalogs,
  deleteCatalog,
} = require("../controllers/catalogueController");

const router = express.Router();
//post request to upload pdf and image
router.post(
  "/upload",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  createCatalog
);
//get request to get all catalogs based on brandId
router.get("/:brandId", getCatalogs);

router.delete("/:id", deleteCatalog);

module.exports = router;
