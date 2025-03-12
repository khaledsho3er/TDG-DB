const express = require("express");
const router = express.Router();
const tagController = require("../controllers/tagController");

router.post("/", tagController.createTag);
router.get("/", tagController.getAllTags);
router.put("/:id", tagController.updateTag);
router.delete("/:id", tagController.deleteTag);
router.get("/tags", tagController.getTagsByCategory);
router.get("/tags/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const tags = await Tag.find({ category }, { id: 1, name: 1 }); // Get tags
    res.status(200).json(tags);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tags", error: error.message });
  }
});

module.exports = router;
