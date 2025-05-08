const AdminNotification = require("../models/adminNotifications");

// Create a new admin notification
exports.createNotification = async (req, res) => {
  try {
    const { type, description } = req.body;

    const notification = new AdminNotification({
      type,
      description,
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error("Error creating admin notification:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
};

// Get all admin notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ date: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Get a single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await AdminNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error fetching admin notification:", error);
    res.status(500).json({ message: "Error fetching notification" });
  }
};

// Update a notification
exports.updateNotification = async (req, res) => {
  try {
    const updatedNotification = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error("Error updating admin notification:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const deletedNotification = await AdminNotification.findByIdAndDelete(
      req.params.id
    );

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await AdminNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Only update if not already read
    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany({ read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ message: "Error marking all notifications as read" });
  }
};
