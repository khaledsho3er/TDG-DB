const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createBimCadFile,
  getAllBimCadFiles,
  getBimCadFileById,
  updateBimCadFile,
  deleteBimCadFile,
} = require("../controllers/bimcontroller");

const router = express.Router();

// Routes
router.post("/upload", upload.single("file"), createBimCadFile); // Create
router.get("/", getAllBimCadFiles); // Read all
router.get("/:id", getBimCadFileById); // Read by ID
router.put("/:id", upload.single("file"), updateBimCadFile); // Update
router.delete("/:id", deleteBimCadFile); // Delete

module.exports = router;
