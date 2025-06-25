const Order = require("../models/order");
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const Brand = require("../models/Brand"); // Import the Brand model
const mongoose = require("mongoose");
const Notification = require("../models/notification"); // Import the Notification model
const AdminNotification = require("../models/adminNotifications"); // Import the AdminNotification model
const nodemailer = require("nodemailer");
const user = require("../models/user");
const transporter = require("../utils/emailTransporter");
const { addOrderToMailchimp } = require("../utils/mailchimp"); // Import it at the top
const { sendEmail } = require("../services/awsSes");
const mailchimpHandler = {
  syncOrder: async (email, order) => {
    try {
      await addOrderToMailchimp(email, order);
    } catch (error) {
      console.error("Mailchimp sync failed:", error);
    }
  },
};
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

    const updatedCartItems = await Promise.all(
      cartItems.map(async (item) => {
        let product, variant;

        // Check if this is a variant order or a regular product order
        if (
          item.variantId &&
          item.variantId !== "undefined" &&
          item.variantId !== "null" &&
          item.variantId !== "" &&
          item.variantId !== "0"
        ) {
          // Handle product variant
          variant = await ProductVariant.findById(item.variantId).populate(
            "productId"
          );
          if (!variant) throw new Error(`Variant not found: ${variant._id}`);

          // Get the parent product to access brandId
          product = variant.productId;
          if (!product)
            throw new Error(`Product not found for variant: ${variant._id}`);

          // Check stock on the variant
          if (variant.stock < item.quantity) {
            throw new Error(`Not enough stock for variant of ${product.name}`);
          }

          // Update variant stock
          variant.stock -= item.quantity;
          await variant.save();

          // Also update product sales for analytics
          product.sales = (product.sales || 0) + item.quantity;
          await product.save();
        } else if (
          item.productId &&
          item.productId !== "undefined" &&
          item.productId !== "null" &&
          item.productId !== "" &&
          item.productId !== "0"
        ) {
          // Handle regular product
          product = await Product.findById(item.productId);
          if (!product) throw new Error(`Product not found: ${item.productId}`);
          if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}`);
          }

          // Update product stock and sales
          product.stock -= item.quantity;
          product.sales = (product.sales || 0) + item.quantity;
          await product.save();
        }

        const brand = await Brand.findById(product.brandId);
        if (!brand)
          throw new Error(`Brand not found for product: ${product._id}`);

        const commissionAmount =
          item.totalPrice * (brand.commissionRate || 0.15);
        const taxAmount = item.totalPrice * (brand.taxRate || 0.14);

        // Create the updated cart item with conditional variantId
        const updatedItem = {
          ...item,
          productId: variant ? variant._id : item.productId,
          brandId: product.brandId,
          commissionAmount,
          taxAmount,
        };

        // Only add variantId if it exists
        if (variant) {
          updatedItem.variantId = variant._id;
        }

        return updatedItem;
      })
    );

    const newOrder = new Order({
      customerId,
      cartItems: updatedCartItems, // Updated with brandId, commission, and tax
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
    const brandId = updatedCartItems[0].brandId; // Get the brandId from the first item
    const brand = await Brand.findById(brandId);
    const brandName = brand ? brand.brandName : "Unknown Brand";
    const itemSummary = savedOrder.cartItems
      .map((item) => `${item.name} x${item.quantity} – $${item.totalPrice}`)
      .join(", ");
    const newNotification = new Notification({
      type: "order",
      description: `You have received a new order from customer ${
        customer.email
      }\nProduct: ${savedOrder.cartItems
        .map((item) => item.name)
        .join(", ")}\nTotal Price: ${savedOrder.total}.`,
      brandId,
      orderId: savedOrder._id,
      read: false,
    });
    await newNotification.save();
    // Create notification for the admin
    const adminNotification = new AdminNotification({
      type: "order",
      description: `New order #${savedOrder._id} created by ${
        customer.email
      } for $${savedOrder.total}. Products: ${savedOrder.cartItems
        .map((item) => item.name)
        .join(", ")} from brand: ${brandName}`,
      read: false,
    });
    await adminNotification.save();
    // ✅ Sync with Mailchimp
    await mailchimpHandler.syncOrder(customer.email, savedOrder);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
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
      .populate("cartItems.productId", "name price mainImage")
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
        $lookup: {
          from: "brands", // Make sure this matches your actual brands collection name
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: "$brandDetails" },
      {
        $project: {
          _id: "$productDetails._id",
          name: "$productDetails.name",
          image: "$productDetails.mainImage",
          price: "$productDetails.price",
          mainImage: "$productDetails.mainImage",
          salePrice: "$productDetails.salePrice",
          stock: "$productDetails.stock",
          brandName: "$brandDetails.brandName",
          brandLogo: "$brandDetails.brandLogo",
          totalSold: 1,
        },
      }, // Format the final output
    ]);

    res.status(200).json(bestSellers);
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
          stock: "$productDetails.stock",

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

exports.getBrandSalesAndEarnings = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { startDate, endDate } = req.query;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const matchQuery = {
      "cartItems.brandId": new mongoose.Types.ObjectId(brandId),
      orderDate: { $gte: new Date(startDate), $lt: new Date(endDate) }, // Date range
    };

    const result = await Order.aggregate([
      { $unwind: "$cartItems" },
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$cartItems.totalPrice" },
          totalCommission: { $sum: "$cartItems.commissionAmount" },
          totalTax: { $sum: "$cartItems.taxAmount" },
        },
      },
    ]);

    const salesData = result[0] || {
      totalSales: 0,
      totalCommission: 0,
      totalTax: 0,
    }; // Handle case where no data is found

    const netEarnings =
      salesData.totalSales - salesData.totalCommission - salesData.totalTax;

    res.status(200).json({
      totalSales: salesData.totalSales,
      totalCommission: salesData.totalCommission,
      totalTax: salesData.totalTax,
      netEarnings,
    });
  } catch (error) {
    console.error("Error fetching sales and earnings:", error);
    res.status(500).json({ error: "Failed to fetch sales and earnings" });
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

    const objectIdBrandId = new mongoose.Types.ObjectId(brandId);

    const brandStats = await Order.aggregate([
      { $unwind: "$cartItems" }, // Split array to process each cart item separately
      { $match: { "cartItems.brandId": objectIdBrandId } }, // Match only cartItems of this brand
      {
        $group: {
          _id: "$cartItems.brandId",
          totalOrders: { $sum: 1 }, // Count all cart items for this brand
          totalSales: { $sum: "$cartItems.totalPrice" }, // Sum totalPrice of all cart items

          // Sales per status
          deliveredSales: {
            $sum: {
              $cond: [
                { $eq: ["$cartItems.subOrderStatus", "Delivered"] },
                "$cartItems.totalPrice",
                0,
              ],
            },
          },
          returnedSales: {
            $sum: {
              $cond: [
                { $eq: ["$cartItems.subOrderStatus", "Returned"] },
                "$cartItems.totalPrice",
                0,
              ],
            },
          },
          confirmedSales: {
            $sum: {
              $cond: [
                { $eq: ["$cartItems.subOrderStatus", "Confirmed"] },
                "$cartItems.totalPrice",
                0,
              ],
            },
          },

          // Count orders per status
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
          totalSales: 1,
          totalDelivered: 1,
          totalReturned: 1,
          totalConfirmed: 1,
          deliveredSales: 1,
          returnedSales: 1,
          confirmedSales: 1,
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
exports.getSalesGraphDataByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    const objectIdBrandId = new mongoose.Types.ObjectId(brandId);

    const salesData = await Order.aggregate([
      { $unwind: "$cartItems" },
      { $match: { "cartItems.brandId": objectIdBrandId } },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          weeklySales: { $sum: "$cartItems.totalPrice" },
          monthlySales: { $sum: "$cartItems.totalPrice" },
          yearlySales: { $sum: "$cartItems.totalPrice" },
        },
      },
      {
        $group: {
          _id: null,
          weeklySales: { $push: { week: "$_id.week", sales: "$weeklySales" } },
          monthlySales: {
            $push: { month: "$_id.month", sales: "$monthlySales" },
          },
          yearlySales: { $push: { year: "$_id.year", sales: "$yearlySales" } },
        },
      },
      {
        $project: {
          _id: 0,
          weeklySales: 1,
          monthlySales: 1,
          yearlySales: 1,
        },
      },
    ]);

    if (!salesData.length) {
      return res
        .status(404)
        .json({ error: "No sales data found for this brand" });
    }

    res.status(200).json(salesData[0]); // Return sales data formatted for the frontend
  } catch (error) {
    console.error("Error in getSalesGraphDataByBrand:", error);
    res.status(500).json({ error: "Failed to fetch sales graph data" });
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
    console.log("Order customer email:", customer.email);
    // Send email notification to customer using AWS SES
    await sendEmail({
      to: customer.email,
      subject: "Your Order Delivery Date Has Been Updated",
      body: `<p>Dear ${order.billingDetails.firstName},</p><p>Your order (ID: ${
        order._id
      }) is scheduled for delivery on ${new Date(
        deliveryDate
      ).toDateString()}.</p><p>Thank you for shopping with us!</p><p>Best regards,<br>The Design Grit </p>`,
    });

    res
      .status(200)
      .json({ message: "Delivery date updated and email sent.", order });
  } catch (error) {
    console.error("Error updating delivery date:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};
// Controller function to update cart item delivery date
exports.updateCartItemDeliveryDate = async (req, res) => {
  const { orderId, cartItemId } = req.params; // Extract orderId and cartItemId from URL parameters
  const { deliveryDate } = req.body; // Extract deliveryDate from request body

  try {
    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the index of the cart item to update
    const cartItemIndex = order.cartItems.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update the subDeliveryDate and subOrderStatus
    order.cartItems[cartItemIndex].subDeliveryDate = deliveryDate;
    order.cartItems[cartItemIndex].subOrderStatus = "Confirmed";

    // Check if all cart items have subOrderStatus as "Confirmed"
    const allConfirmed = order.cartItems.every(
      (item) => item.subOrderStatus === "Confirmed"
    );

    if (allConfirmed) {
      order.orderStatus = "Confirmed"; // Update orderStatus if all items are confirmed
    }
    order.markModified("cartItems");

    // Save the updated order
    await order.save();

    // Send email notification to customer using AWS SES
    const customer = await user.findById(order.customerId).select("email");
    console.log(
      "Order customer email:",
      customer.email,
      "user:0",
      customer,
      "order billing name",
      order.billingDetails.firstName
    );
    console.log("order id", order._id, "order deleviery", deliveryDate);
    if (customer && customer.email) {
      await sendEmail({
        to: customer.email,
        subject: "Your Order Item Delivery Date Has Been Updated",
        body: `<p>Dear ${
          order.billingDetails.firstName
        },</p><p>An item in your order (ID: ${
          order._id
        }) is scheduled for delivery on ${new Date(
          deliveryDate
        ).toDateString()}.</p><p>Thank you for shopping with us!</p><p>Best regards,<br>The Design Grit</p>`,
      });
    }

    return res.status(200).json({
      message: "Cart item updated successfully",
      orderStatusUpdated: allConfirmed, // Indicate if order status was updated
      order,
    });
  } catch (error) {
    console.error("Error updating cart item delivery date:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
exports.addOrderNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ message: "Note is required." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if a note already exists
    if (order.note) {
      return res.status(400).json({
        message: "A note has already been added. It cannot be modified.",
      });
    }

    const customerId = order.customerId;
    if (!customerId) {
      return res
        .status(400)
        .json({ error: "Customer ID is missing from order" });
    }

    // Fetch customer email from the User model
    const customer = await user.findById(customerId).select("email");
    if (!customer || !customer.email) {
      return res.status(400).json({ error: "Customer email not found" });
    }

    // Update the order's note field
    order.note = note;
    order.notePostedAt = new Date();
    await order.save();

    // Send email notification to the customer using AWS SES
    await sendEmail({
      to: customer.email,
      subject: "Order Note Added",
      body: `<p>Dear Customer,</p><p>A note has been added to your order (ID: ${order._id}).</p><p>Note: "${note}"</p><p>Thank you for shopping with us!</p><p>Best regards,<br>The Design Grit</p>`,
    });

    res.status(200).json({ message: "Note added successfully.", order });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "firstName lastName email")
      .populate("cartItems.productId", "name price")
      .populate("cartItems.brandId", "name")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error getting all orders:", error);
    res.status(500).json({ message: "Server error.", error });
  }
};
// Ping the brand for a specific order
exports.pingBrandOnOrder = async (req, res) => {
  try {
    const { brandId, orderId } = req.body;

    if (!brandId || !orderId) {
      return res
        .status(400)
        .json({ message: "brandId and orderId are required." });
    }

    // Create a notification
    const notification = new Notification({
      type: "Order Ping",
      description: `You have a pending order (#${orderId}) that needs attention.`,
      brandId,
      orderId,
    });
    await notification.save();

    res.status(200).json({ message: "Ping sent successfully!" });
  } catch (error) {
    console.error("Error sending ping:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    // Validate payment status
    if (!["Pending", "Paid", "Failed"].includes(paymentStatus)) {
      return res.status(400).json({
        message:
          "Invalid payment status. Must be one of: Pending, Paid, Failed",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment status
    order.paymentDetails.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
