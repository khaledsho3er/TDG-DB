const express = require("express");
const router = express.Router();
const conceptController = require("../controllers/conceptController");
const upload = require("../middlewares/conceptsMulter");

// Create
router.post("/", upload.single("image"), conceptController.createConcept);

// Get All
router.get("/", conceptController.getAllConcepts);

// Get One
router.get("/:id", conceptController.getOneConcept);

// Edit
router.put("/:id", upload.single("image"), conceptController.editConcept);

// Delete
router.delete("/:id", conceptController.deleteConcept);

module.exports = router;
