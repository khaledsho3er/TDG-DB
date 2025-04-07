const express = require("express");
const router = express.Router();
const {
  createConceptImage,
  getAllConceptImages,
  getConceptImageById,
  updateConceptImage,
  deleteConceptImage,
} = require("../controllers/conceptController");
const upload = require("../middlewares/conceptsMulter"); // Multer middleware

// Routes for concept image management
router.post("/concepts", upload.single("image"), createConceptImage); // POST request to upload concept image
router.get("/concepts", getAllConceptImages); // GET request to get all concepts
router.get("/concepts/:id", getConceptImageById); // GET request to get one concept
router.put("/concepts/:id", upload.single("image"), updateConceptImage); // PUT request to update concept image
router.delete("/concepts/:id", deleteConceptImage); // DELETE request to delete a concept image

module.exports = router;
