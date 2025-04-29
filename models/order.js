const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        brandId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Brand",
          required: true,
        }, // Added brandId
        name: { type: String, required: true }, // Product name
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        subDeliveryDate: { type: Date },
        subOrderStatus: {
          type: String,
          default: "Pending",
          enum: ["Pending", "Confirmed", "Delivered", "Returned", "Cancelled"],
        },
        commissionAmount: { type: Number }, // Added commissionAmount
        taxAmount: { type: Number },
      },
    ],

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    deliveryDate: { type: Date },
    orderStatus: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Confirmed", "Delivered", "Returned", "Cancelled"],
    },
    POD: { type: String }, // proof of Delivery file uploaded by the delivery person
    note: { type: String, default: null }, // Note can be written once and cannot be changed
    notePostedAt: { type: Date, default: null }, // You can mark this as immutable if desired

    orderDate: { type: Date, default: Date.now },
    paymentDetails: {
      paymentMethod: {
        type: String,
        required: true,
        enum: ["card", "cash", "paypal"],
      },
      cardNumber: { type: String }, // Store last 4 digits for security
      expiry: { type: String },
      cvv: { type: String },
    },
    billingDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      country: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    shippingDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      label: { type: String }, // e.g., Home, Office
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
