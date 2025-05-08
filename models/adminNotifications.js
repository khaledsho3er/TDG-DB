const mongoose = require("mongoose");

const adminNotificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'order', 'user', 'product'
    description: { type: String, required: true },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const AdminNotification = mongoose.model(
  "AdminNotification",
  adminNotificationSchema
);
module.exports = AdminNotification;
