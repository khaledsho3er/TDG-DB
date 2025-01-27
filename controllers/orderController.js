const Order = require("../models/order");
const Product = require("../models/Products");

// Create an order
const createOrder = async (req, res) => {
  const {
    cartItems,
    customerId,
    billingDetails,
    shippingDetails,
    paymentMethod,
  } = req.body;

  try {
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const vendorOrders = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        return {
          vendor: product.vendor,
          products: [
            {
              productId: item.productId,
              quantity: item.quantity,
              totalPrice: product.price * item.quantity,
            },
          ],
          totalAmount: product.price * item.quantity,
        };
      })
    );

    const newOrder = new Order({
      customerId,
      vendorOrders,
      billingDetails,
      shippingDetails,
      paymentMethod,
    });

    await newOrder.save();
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Get a single order by ID
const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// Update an order (for example, update status or shipping details)
const updateOrder = async (req, res) => {
  const { orderId } = req.params;
  const updates = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
    });

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
