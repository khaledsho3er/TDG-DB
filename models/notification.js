const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g., 'order', 'quotation'
    description: { type: String, required: true },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    }, // Brand this notification belongs to
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Reference to Order
    read: { type: Boolean, default: false }, // If the notification has been read
    date: { type: Date, default: Date.now }, // Date when the notification was created
    readAt: { type: Date }, // Date when the notification was read
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
