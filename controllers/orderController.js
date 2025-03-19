const Order = require("../models/order");
const Product = require("../models/Products");
const mongoose = require("mongoose");
const Notification = require("../models/notification"); // Import the Notification model
const nodemailer = require("nodemailer");
const user = require("../models/user");
const transporter = require("../utils/emailTransporter");

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
        // Check if enough stock is available
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        // Update stock and sales
        product.stock -= item.quantity;
        product.sales += item.quantity;
        await product.save();

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
    const customer = await user.findById(customerId).select("email");
    if (!customer || !customer.email) {
      return res.status(400).json({ error: "Customer email not found" });
    }

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
    // Send an email to the customer with the order ID
    const mailOptions = {
      from: "karimwahba53@gmail.com",
      to: customer.email,
      subject: `Purchase Successfully Order: #${savedOrder._id}`,
      text: `Your order with ID ${
        savedOrder._id
      } has been successfully purchased. ${savedOrder.cartItems
        .map(
          (item, index) =>
            `Item ${index + 1}: ${item.name} with quantity ${
              item.quantity
            } and price ${item.price}`
        )
        .join(", ")}. Total price: ${savedOrder.total}.`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return console.log(error);
      console.log("Email sent: " + info.response);
    });
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
          mainImage: "$productDetails.mainImage",
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

// const calculateOrderStatusTotal = async (
//   startDate,
//   endDate,
//   status,
//   brandId
// ) => {
//   try {
//     const orders = await Order.aggregate([
//       {
//         $match: {
//           "cartItems.brandId": new mongoose.Types.ObjectId(brandId), // ✅ Correct filtering
//           orderDate: { $gte: startDate, $lt: endDate },
//           orderStatus: status,
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: "$total" },
//         },
//       },
//     ]);
//     return orders.length > 0 ? orders[0].total : 0;
//   } catch (error) {
//     console.error(`Error calculating ${status} orders:`, error);
//     return 0;
//   }
// };

// const calculateBrandTotal = async (
//   startDate,
//   endDate,
//   status = null,
//   brandId
// ) => {
//   const matchQuery = {
//     orderDate: { $gte: startDate, $lt: endDate },
//     "cartItems.brandId": new mongoose.Types.ObjectId(brandId),
//   };
//   if (status) matchQuery.orderStatus = status;

//   const orders = await Order.aggregate([
//     { $match: matchQuery },
//     { $unwind: "$cartItems" }, // 🔥 Unwind cartItems to work at the product level
//     { $match: { "cartItems.brandId": new mongoose.Types.ObjectId(brandId) } }, // ✅ Filter again after unwinding
//     { $group: { _id: null, total: { $sum: "$cartItems.totalPrice" } } }, // ✅ Sum only the brand's products
//   ]);

//   return orders.length > 0 ? orders[0].total : 0;
// };

// exports.getBrandOrdersStatistics = async (req, res) => {
//   const { brandId } = req.params; // Get Brand ID from URL
//   if (!brandId) return res.status(400).json({ error: "Brand ID is required" });

//   // Define date ranges for current and last month
//   const currentMonthStart = new Date(
//     new Date().getFullYear(),
//     new Date().getMonth(),
//     1
//   );
//   const currentMonthEnd = new Date(
//     new Date().getFullYear(),
//     new Date().getMonth() + 1,
//     0
//   );
//   const lastMonthStart = new Date(
//     new Date().getFullYear(),
//     new Date().getMonth() - 1,
//     1
//   );
//   const lastMonthEnd = new Date(
//     new Date().getFullYear(),
//     new Date().getMonth(),
//     0
//   );

//   try {
//     const calculateBrandTotal = async (
//       req,
//       startDate,
//       endDate,
//       status = null
//     ) => {
//       try {
//         console.log("Request params:", req.params);
//         console.log("Request body:", req.body);

//         const brandId = req.params.brandId || req.body.brandId;
//         if (!brandId) throw new Error("Brand ID is required");

//         console.log("Extracted brandId:", brandId);

//         const brandObjectId = new mongoose.Types.ObjectId(brandId);
//         console.log("Converted ObjectId:", brandObjectId);

//         const matchQuery = {
//           "cartItems.brandId": brandObjectId,
//           orderDate: { $gte: startDate, $lt: endDate },
//         };

//         if (status) {
//           matchQuery["cartItems.subOrderStatus"] = status;
//         }

//         console.log(
//           "Aggregation Match Query:",
//           JSON.stringify(matchQuery, null, 2)
//         );

//         const orders = await Order.aggregate([
//           { $match: matchQuery },
//           { $unwind: { path: "$cartItems", preserveNullAndEmptyArrays: true } },
//           { $match: { "cartItems.brandId": brandId } },
//           { $group: { _id: null, total: { $sum: "$cartItems.totalPrice" } } },
//         ]);

//         console.log("Final Aggregation Query Result:", orders);
//         return orders.length > 0 ? orders[0].total : 0;
//       } catch (error) {
//         console.error("Error in calculateBrandTotal:", error.message);
//         return 0;
//       }
//     };

//     // Fetch order statistics for current and last month
//     const [
//       currentTotal,
//       lastTotal,
//       currentActive,
//       lastActive,
//       currentCompleted,
//       lastCompleted,
//       currentReturned,
//       lastReturned,
//     ] = await Promise.all([
//       calculateBrandTotal(currentMonthStart, currentMonthEnd), // Total Orders (all statuses)
//       calculateBrandTotal(lastMonthStart, lastMonthEnd),
//       calculateBrandTotal(currentMonthStart, currentMonthEnd, "Confirmed"), // Active Orders
//       calculateBrandTotal(lastMonthStart, lastMonthEnd, "Confirmed"),
//       calculateBrandTotal(currentMonthStart, currentMonthEnd, "Delivered"), // Completed Orders
//       calculateBrandTotal(lastMonthStart, lastMonthEnd, "Delivered"),
//       calculateBrandTotal(currentMonthStart, currentMonthEnd, "Returned"), // Returned Orders
//       calculateBrandTotal(lastMonthStart, lastMonthEnd, "Returned"),
//     ]);

//     // Calculate percentage change
//     const calculatePercentageChange = (current, last) => {
//       return last > 0 ? (((current - last) / last) * 100).toFixed(1) : "0.0";
//     };

//     // Return response
//     res.status(200).json({
//       totalOrders: currentTotal,
//       percentageChange: calculatePercentageChange(currentTotal, lastTotal),
//       activeOrders: currentActive,
//       activePercentageChange: calculatePercentageChange(
//         currentActive,
//         lastActive
//       ),
//       completedOrders: currentCompleted,
//       completedPercentageChange: calculatePercentageChange(
//         currentCompleted,
//         lastCompleted
//       ),
//       returnedOrders: currentReturned,
//       returnedPercentageChange: calculatePercentageChange(
//         currentReturned,
//         lastReturned
//       ),
//     });
//   } catch (error) {
//     console.error("Error fetching brand order statistics:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

exports.getOrderStatisticsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const objectIdBrandId = new mongoose.Types.ObjectId(brandId); // Convert brandId to ObjectId

    const brandStats = await Order.aggregate([
      { $unwind: "$cartItems" }, // Split array to process each cart item separately
      { $match: { "cartItems.brandId": objectIdBrandId } }, // Match only cartItems of this brand
      {
        $group: {
          _id: "$cartItems.brandId",
          totalOrders: { $sum: 1 }, // Count all cart items for this brand
          totalDelivered: {
            $sum: {
              $cond: [
                { $eq: ["$cartItems.subOrderStatus", "Delivered"] },
                1,
                0,
              ],
            },
          },
          totalReturned: {
            $sum: {
              $cond: [{ $eq: ["$cartItems.subOrderStatus", "Returned"] }, 1, 0],
            },
          },
          totalConfirmed: {
            $sum: {
              $cond: [
                { $eq: ["$cartItems.subOrderStatus", "Confirmed"] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brandInfo",
        },
      },
      { $unwind: "$brandInfo" },
      {
        $project: {
          _id: 0,
          brandId: "$_id",
          brandName: "$brandInfo.name",
          totalOrders: 1,
          totalDelivered: 1,
          totalReturned: 1,
          totalConfirmed: 1,
        },
      },
    ]);

    if (!brandStats.length) {
      return res.status(404).json({ error: "No orders found for this brand" });
    }

    res.status(200).json(brandStats[0]); // Return only one object instead of an array
  } catch (error) {
    console.error("Error in getOrderStatisticsByBrand:", error);
    res.status(500).json({ error: "Failed to fetch brand statistics" });
  }
};

// Update Order Delivery Date and Notify Customer
exports.updateDeliveryDate = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryDate } = req.body; // The vendor provides the delivery date

    if (!deliveryDate) {
      return res.status(400).json({ message: "Delivery date is required." });
    }

    // Find order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    // Fetch customer email from User model
    const customer = await user.findById(order.customerId).select("email");
    if (!customer || !customer.email) {
      return res.status(400).json({ message: "Customer email not found." });
    }
    // Update delivery date and order status
    order.deliveryDate = deliveryDate;
    order.orderStatus = "Confirmed"; // Assuming order is now in progress

    await order.save();

    // Send email notification to customer
    const mailOptions = {
      from: "karimwahba53@gmail.com",
      to: customer.email,
      subject: "Your Order Delivery Date Has Been Updated",
      text: `Dear ${order.billingDetails.firstName},\n\nYour order (ID: ${
        order._id
      }) is scheduled for delivery on ${new Date(
        deliveryDate
      ).toDateString()}.\n\nThank you for shopping with us!\n\nBest regards,\nYour Company Name`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Delivery date updated and email sent.", order });
  } catch (error) {
    console.error("Error updating delivery date:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};
// Function to handle file upload and update order
exports.uploadFileAndUpdateOrder = async (req, res) => {
  try {
    console.log("Received file:", req.file); // Debug log
    console.log("Request body:", req.body); // Debug log

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const orderId = req.params.orderId;
    const fileName = req.file.key;

    await Order.findByIdAndUpdate(
      orderId,
      { POD: fileName, orderStatus: "Delivered" },
      { new: true }
    );

    const fileUrl = `https://a29dbeb11704750c5e1d4b4544ae5595.r2.cloudflarestorage.com/files/${fileName}`;
    return res.status(200).json({
      message: "File uploaded successfully and the orderStatus is delivered",
      fileUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get sales data grouped by time period
exports.getSalesData = async (req, res) => {
  try {
    const { period } = req.query; // 'weekly', 'monthly', 'yearly'

    let groupFormat;
    let dateLimit = new Date();

    if (period === "weekly") {
      groupFormat = {
        year: { $year: "$orderDate" },
        week: { $isoWeek: "$orderDate" },
      };
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (period === "monthly") {
      groupFormat = {
        year: { $year: "$orderDate" },
        month: { $month: "$orderDate" },
      };
      dateLimit.setMonth(dateLimit.getMonth() - 1);
    } else if (period === "yearly") {
      groupFormat = { year: { $year: "$orderDate" } };
      dateLimit.setFullYear(dateLimit.getFullYear() - 1);
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    const salesData = await Order.aggregate([
      { $match: { orderDate: { $gte: dateLimit } } }, // Filter orders from the past period
      { $group: { _id: groupFormat, totalSales: { $sum: "$total" } } }, // Group by period
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }, // Sort data
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
