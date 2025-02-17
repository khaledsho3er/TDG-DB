// controllers/notificationsController.js
const Notification = require("../models/notification");

exports.markAsRead = async (req, res) => {
  const { id } = req.params; // Get notification ID from URL params

  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Mark notification as read
    notification.read = true;
    notification.readTime = Date.now();
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
