const express = require("express");
const router = express.Router();
const Notification = require("../models/notification"); // Import the Notification model
const notificationController = require("../controllers/notificationController");

// GET notifications for the brand
router.get("/notifications", async (req, res) => {
  try {
    const { brandId } = req.query; // Get brandId from query parameters
    const notifications = await Notification.find({ brandId }).sort({
      date: -1,
    }); // Sort notifications by date
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

router.patch("/:id/mark-as-read", notificationController.markAsRead);

module.exports = router;
