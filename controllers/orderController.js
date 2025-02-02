const Order = require("../models/order");
const Product = require("../models/Products");
const mongoose = require("mongoose");
const Notification = require("../models/notification"); // Import the Notification model

// ✅ Create a new order with brandId auto-assigned
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      cartItems,
      subtotal,
      shippingFee,
      total,
      orderStatus,
      paymentDetails,
      billingDetails,
      shippingDetails,
    } = req.body;

    // Fetch each product from the database to get the brandId
    const updatedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return {
          ...item,
          brandId: product.brandId, // Auto-assign brandId from Product schema
        };
      })
    );

    // Create the order with updated cartItems
    const newOrder = new Order({
      customerId,
      cartItems: updatedCartItems, // Updated with brandId
      subtotal,
      shippingFee,
      total,
      orderStatus,
      paymentDetails,
      billingDetails,
      shippingDetails,
    });

    const savedOrder = await newOrder.save();
    // Create a new notification for the brand
    const brandId = updatedCartItems[0].brandId; // Get the brandId from the first item (can be adjusted if necessary)
    const newNotification = new Notification({
      type: "order",
      description: `You have received a new order from customer ${customerId}.`,
      brandId, // Associate this notification with the brand
      orderId: savedOrder._id,
      read: false,
    });

    // Save the notification to the database
    await newNotification.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate(
      "customerId vendorId cartItems.productId cartItems.brandId"
    );
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single order by ID
// ✅ Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "customerId cartItems.productId cartItems.brandId"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrdersByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ message: "Brand ID is required" });
    }

    // Find orders that contain at least one product with the given brandId
    const orders = await Order.find({ "cartItems.brandId": brandId })
      .populate("customerId", "firstName lastName email")
      .populate("cartItems.productId", "name price")
      .populate("cartItems.brandId", "name"); // Populate Brand info

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this brand" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by brand ID:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
// ✅ Update an order
exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder)
      return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
