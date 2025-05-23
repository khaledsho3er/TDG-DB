const express = require("express");
const upload = require("../middlewares/catalogsUpload");
const {
  createCatalog,
  getCatalogs,
  updateCatalog,
  deleteCatalog,
} = require("../controllers/catalogController");

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
router.put(
  "/:id",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  updateCatalog
);
router.delete("/:id", deleteCatalog);

module.exports = router;
