const Order = require("../models/order");
const Product = require("../models/Products");

// ✅ Create a new order with brandId auto-assigned
exports.createOrder = async (req, res) => {
  try {
    const { customerId, cartItems, subtotal, shippingFee, total, orderStatus, paymentDetails, billingDetails, shippingDetails } = req.body;

    // Fetch each product from the database to get the brandId
    const updatedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return { 
          ...item, 
          brandId: product.brandId  // Auto-assign brandId from Product schema
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
      shippingDetails
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// ✅ Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("customerId vendorId cartItems.productId cartItems.brandId");
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customerId vendorId cartItems.productId cartItems.brandId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update an order
exports.updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
