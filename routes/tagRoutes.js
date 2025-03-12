const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");

router.post("/", tagController.createTag);
router.get("/", tagController.getAllTags);
router.put("/:id", tagController.updateTag);
router.delete("/:id", tagController.deleteTag);
router.get("/tags", tagController.getTagsByCategory);

module.exports = router;
