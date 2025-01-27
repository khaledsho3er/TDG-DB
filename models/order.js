const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    vendorOrders: [
      {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        products: [
          {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
            totalPrice: Number,
          },
        ],
        totalAmount: Number,
      },
    ],
    orderStatus: { type: String, default: "Pending" },
    orderDate: { type: Date, default: Date.now },
    paymentMethod: { type: String },

    // Embedded Billing Information
    billingDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      country: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },

    // Embedded Shipping Information
    shippingDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      label: { type: String, required: true }, // e.g., Home, Office
      apartment: { type: String },
      floor: { type: String },
      country: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
