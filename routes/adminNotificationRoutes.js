const express = require("express");
const router = express.Router();
const adminNotificationController = require("../controllers/adminNotificationController");

// Get all admin notifications
router.get("/", adminNotificationController.getAllNotifications);

// Get a single notification by ID
router.get("/:id", adminNotificationController.getNotificationById);

// Create a new notification
router.post("/", adminNotificationController.createNotification);

// Update a notification
router.put("/:id", adminNotificationController.updateNotification);

// Delete a notification
router.delete("/:id", adminNotificationController.deleteNotification);

// Mark a notification as read
router.patch("/:id/mark-as-read", adminNotificationController.markAsRead);

// Mark all notifications as read
router.patch("/mark-all-as-read", adminNotificationController.markAllAsRead);

module.exports = router;
