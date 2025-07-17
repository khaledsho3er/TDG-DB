const ReturnRequest = require("../models/returnsOrder");
const Order = require("../models/order");
const AdminFinancialLog = require("../models/AdminFinancialLog");
const shippingFee = require("../models/shippingFee");
const Notification = require("../models/notification");
const AdminNotification = require("../models/adminNotifications");
const User = require("../models/user");

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason, userId } = req.body; // <-- add userId here

    const order = await Order.findById(orderId).populate(
      "cartItems.productId cartItems.brandId"
    );

    if (!order || order.customerId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized or order not found" });
    }

    const items = order.cartItems.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }));

    const returnRequest = new ReturnRequest({
      orderId: order._id,
      customerId: userId,
      brandId: order.cartItems[0].brandId._id,
      items,
      totalRefundAmount: order.total,
      reason,
    });

    await returnRequest.save();

    // Fetch user for name
    const user = await User.findById(userId);
    const userName = user
      ? `${user.firstName} ${user.lastName}`
      : "Unknown User";
    const productNames = order.cartItems.map((item) => item.name).join(", ");
    const deliveryDate = order.deliveryDate
      ? order.deliveryDate.toISOString().split("T")[0]
      : "Unknown Date";
    const notificationDescription = `${userName} requested to return order ${order._id} containing product(s): ${productNames}, delivered on ${deliveryDate}, with reason: ${reason}`;

    const notification = new Notification({
      type: "Return Order Request",
      description: notificationDescription,
      brandId: order.cartItems[0].brandId._id,
      orderId: order._id,
    });
    await notification.save();

    // Also notify admin
    const AdminNotification = require("../models/adminNotifications");
    const adminNotification = new AdminNotification({
      type: "Return Order Request",
      description: notificationDescription,
    });
    await adminNotification.save();

    order.orderStatus = "Returning";
    await order.save();

    res.status(201).json({ message: "Return request created", returnRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateReturnByBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandStatus, brandReason } = req.body;

    if (!["Received", "Not Received"].includes(brandStatus)) {
      return res.status(400).json({ error: "Invalid brand status" });
    }

    // If brandStatus is "Not Received", require a reason
    if (
      brandStatus === "Not Received" &&
      (!brandReason || brandReason.trim() === "")
    ) {
      return res.status(400).json({
        error: "Reason is required when brand status is 'Not Received'",
      });
    }

    // If brandStatus is "Received", ignore any reason in the request
    const request = await ReturnRequest.findById(id);
    if (!request)
      return res.status(404).json({ error: "Return request not found" });

    request.brandStatus = brandStatus;
    if (brandStatus === "Not Received") {
      request.brandReason = brandReason;
    }
    // If Received, do not update the reason (leave as is)

    await request.save();

    // Notify admin about brand's action
    let adminDescription;
    if (brandStatus === "Received") {
      adminDescription = `Brand has received the returned product for return request (${id}).`;
    } else {
      adminDescription = `Brand has NOT received the returned product for return request (${id}) due to: ${brandReason}`;
    }
    const adminNotification = new AdminNotification({
      type: "Return Order Update by Brand",
      description: adminDescription,
    });
    await adminNotification.save();

    res.json({ message: "Brand status updated", request });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateReturnByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["Approved", "Rejected", "Refunded"].includes(status)) {
      return res.status(400).json({ error: "Invalid admin status" });
    }

    const request = await ReturnRequest.findById(id).populate("orderId");
    if (!request)
      return res.status(404).json({ error: "Return request not found" });

    const order = request.orderId;
    if (!order) return res.status(400).json({ error: "Order not found" });

    const refundBrandId = request.brandId.toString();

    if (status === "Refunded") {
      const refundItems = order.cartItems.filter(
        (item) => item.brandId?.toString() === refundBrandId
      );

      if (refundItems.length === 0)
        return res
          .status(400)
          .json({ error: "No matching brand items found in order." });

      // Calculate product total and VAT (14%)
      let productTotal = refundItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      let totalVat = refundItems.reduce(
        (sum, item) => sum + (item.taxAmount ?? item.totalPrice * 0.14),
        0
      );
      let totalCommission = 0;
      for (const item of refundItems) {
        totalCommission += item.commissionAmount ?? item.totalPrice * 0.15;
      }

      const paymobFee = +((productTotal + totalVat) * 0.03).toFixed(2);
      const brandPayout = +(productTotal - totalCommission).toFixed(2); // Do not subtract shipping or VAT
      const netAdminProfit = +(totalCommission - paymobFee).toFixed(2);
      console.log(
        "Refunding paymob transaction id :",
        order.paymentDetails.transactionId
      );

      // Refund via Paymob: product price + VAT only
      if (order.paymentDetails && order.paymentDetails.transactionId) {
        // Here, transactionId is actually the Paymob order ID
        const paymobOrderId = order.paymentDetails.transactionId;
        // Retrieve the real transaction ID from Paymob
        const paymobService = require("../services/paymobService");
        const realTransactionId = await paymobService.getTransactionIdByOrderId(
          paymobOrderId
        );
        const refundAmount = productTotal + totalVat;
        await paymobService.refundTransaction(
          realTransactionId,
          Math.round(refundAmount * 100)
        );

        // Send refund email to user
        const { sendEmail } = require("../services/awsSes");
        let userEmail = null;
        if (order.billingDetails && order.billingDetails.email) {
          userEmail = order.billingDetails.email;
        } else if (order.customerId) {
          const user = await User.findById(order.customerId);
          userEmail = user?.email;
        }
        if (userEmail) {
          const subject = "Your refund has been processed";
          const body = `Dear Customer,<br><br>Your refund for order <b>${order._id}</b> has been processed successfully. The refunded amount (excluding shipping fees) will be returned to your bank account within 10-14 business days.<br><br>If you have any questions, please contact our support team.<br><br>Thank you for shopping with us!`;
          try {
            await sendEmail({ to: userEmail, subject, body });
          } catch (emailErr) {
            console.error("Failed to send refund email:", emailErr);
          }
        }
      }

      // Log the reversal in AdminFinancialLog
      await AdminFinancialLog.create({
        orderId: order._id,
        brandId: refundBrandId,
        total: -(productTotal + totalVat),
        shippingFee: 0, // Not refunded
        vat: -totalVat,
        commission: -totalCommission,
        paymobFee: -paymobFee,
        brandPayout: -brandPayout,
        netAdminProfit: -netAdminProfit,
        capturedAmount: -order.capturedAmount,
        convertedAmount: -order.convertedAmount,
        date: order.createdAt,
        month: new Date(order.createdAt).getMonth() + 1,
        year: new Date(order.createdAt).getFullYear(),
      });

      // Update order summary fields (optional)
      order.brandPayout = Math.max(0, order.brandPayout - brandPayout);
      order.netAdminProfit = Math.max(0, order.netAdminProfit - netAdminProfit);
      order.orderStatus = "Refunded";
      await order.save();
    }

    request.status = status;
    request.adminNote = adminNote;
    request.reviewedAt = new Date();
    await request.save();
    order.orderStatus = "Refunded";
    await order.save();
    res.json({
      message: "Admin status updated and financials adjusted",
      request,
    });
  } catch (err) {
    console.error("Admin refund error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllReturns = async (req, res) => {
  try {
    const requests = await ReturnRequest.find().populate(
      "orderId customerId brandId"
    );
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getReturnById = async (req, res) => {
  try {
    const request = await ReturnRequest.findById(req.params.id).populate(
      "orderId customerId brandId"
    );
    if (!request)
      return res.status(404).json({ error: "Return request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteReturn = async (req, res) => {
  try {
    const request = await ReturnRequest.findByIdAndDelete(req.params.id);
    if (!request)
      return res.status(404).json({ error: "Return request not found" });
    res.json({ message: "Return request deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
exports.getReturnsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    const requests = await ReturnRequest.find({ brandId }).populate(
      "orderId customerId brandId"
    );

    res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching returns by brand:", err);
    res.status(500).json({ error: "Server error" });
  }
};
