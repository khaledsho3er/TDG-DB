const Order = require("../models/order");
const Product = require("../models/Products");
const mongoose = require("mongoose");
const Notification = require("../models/notification"); // Import the Notification model
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "karimwahba53@gmail.com",
    pass: "lryi gnbd gcew gkpj",
  },
});
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
// ✅ Get orders by customerId
exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // Find orders where customerId matches and populate the necessary fields
    const orders = await Order.find({ customerId })
      .populate("cartItems.productId", "name price")
      .populate("cartItems.brandId", "name")
      .populate("customerId", "firstName lastName email"); // Populate user info if necessary

    if (!orders || orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this customer" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by customer ID:", error);
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

exports.getBestSellers = async (req, res) => {
  try {
    const bestSellers = await Order.aggregate([
      { $unwind: "$cartItems" }, // Flatten cartItems array
      {
        $group: {
          _id: "$cartItems.productId",
          totalSold: { $sum: "$cartItems.quantity" },
        },
      }, // Count total quantity sold per product
      { $sort: { totalSold: -1 } }, // Sort by highest sales
      { $limit: 10 }, // Limit to top 10 bestsellers
      {
        $project: {
          _id: { $toObjectId: "$_id" }, // Convert string to ObjectId
          totalSold: 1,
        },
      },
      {
        $lookup: {
          from: "products", // Ensure this matches your collection name in MongoDB
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      }, // Fetch product details
      { $unwind: "$productDetails" }, // Convert product array into object
      {
        $project: {
          _id: "$productDetails._id",
          name: "$productDetails.name",
          image: "$productDetails.mainImage",
          price: "$productDetails.price",
          totalSold: 1,
        },
      }, // Format the final output
    ]);

    res.status(200).json(bestSellers);
    console.log("Bestsellers:", bestSellers);
  } catch (error) {
    console.error("Error fetching bestsellers:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getVendorBestSellers = async (req, res) => {
  try {
    console.log("Request params:", req.params);
    const { brandId } = req.params; // Extract brandId correctly from URL

    if (!brandId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No brandId provided" });
    }

    const brandObjectId = new mongoose.Types.ObjectId(brandId);

    console.log("Extracted brandId:", brandId);
    console.log("Converted ObjectId:", brandObjectId);

    const bestSellers = await Order.aggregate([
      { $unwind: "$cartItems" }, // Flatten cartItems array
      {
        $match: {
          "cartItems.brandId": brandObjectId, // Filter orders by brandId from cartItems
        },
      },
      {
        $group: {
          _id: "$cartItems.productId",
          totalSold: { $sum: "$cartItems.quantity" },
        },
      }, // Count total quantity sold per product
      { $sort: { totalSold: -1 } }, // Sort by highest sales
      { $limit: 10 }, // Limit to top 10 bestsellers
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      }, // Fetch product details
      { $unwind: "$productDetails" }, // Convert product array into object
      {
        $project: {
          _id: "$productDetails._id",
          name: "$productDetails.name",
          image: "$productDetails.mainImage",
          price: "$productDetails.price",
          totalSold: 1,
        },
      }, // Format the final output
    ]);

    console.log("Final Aggregation Query Result:", bestSellers);

    res.status(200).json(bestSellers);
  } catch (error) {
    console.error("Error fetching vendor bestsellers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Function to calculate total orders for a given date range
const calculateTotalOrders = async (startDate, endDate) => {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" }, // Sum the total field from the order
        },
      },
    ]);
    return orders.length > 0 ? orders[0].total : 0;
  } catch (error) {
    console.error("Error calculating total orders:", error);
    return 0;
  }
};

// Export function to calculate percentage change between current and previous month
exports.getPercentageChange = async (req, res) => {
  const currentMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ); // Start of current month
  const currentMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ); // End of current month

  const lastMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  ); // Start of previous month
  const lastMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    0
  ); // End of previous month

  try {
    const currentMonthTotal = await calculateTotalOrders(
      currentMonthStart,
      currentMonthEnd
    );
    const lastMonthTotal = await calculateTotalOrders(
      lastMonthStart,
      lastMonthEnd
    );

    let percentageChange = 0;
    if (lastMonthTotal > 0) {
      percentageChange =
        ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    }

    // Return the data as JSON
    res.status(200).json({
      totalOrders: currentMonthTotal,
      percentageChange: percentageChange.toFixed(1),
    });
    console.log(
      "Total Orders:",
      currentMonthTotal,
      "Percentage Change:",
      percentageChange.toFixed(1)
    );
  } catch (error) {
    console.error("Error fetching percentage change data:", error);
    res.status(500).json({ error: error.message });
  }
};
