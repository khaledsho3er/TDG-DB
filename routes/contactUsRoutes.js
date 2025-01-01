const express = require("express");
const router = express.Router();
const {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
} = require("../controllers/contactUsController");

// Route to create a new message
router.post("/contact", createMessage);

// Route to get all messages (Admin use)
router.get("/admin/messages", getAllMessages);

// Route to get a single message by ID
router.get("/admin/message/:id", getMessageById);

// Route to update a message by ID (Admin use)
router.put("/admin/message/:id", updateMessage);

// Route to delete a message by ID (Admin use)
router.delete("/admin/message/:id", deleteMessage);

module.exports = router;
