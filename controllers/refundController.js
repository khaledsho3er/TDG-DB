const Refund = require("../models/refund");
const Order = require("../models/order"); // Assuming you might need to access Order data

// ✅ Create a new refund record
exports.createRefund = async (req, res) => {
  try {
    const { orderId, refundAmount, refundReason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const newRefund = new Refund({
      orderId,
      brandId: order.cartItems[0].brandId, // Assuming all items in an order belong to the same brand for refund purposes; adjust if needed
      refundAmount,
      refundReason,
    });

    const savedRefund = await newRefund.save();
    res.status(201).json(savedRefund);
  } catch (error) {
    console.error("Error creating refund:", error);
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get all refund records (admin only or internal use)
exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().populate("orderId brandId processedBy");
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single refund record by ID
exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id).populate(
      "orderId brandId processedBy"
    );
    if (!refund) {
      return res.status(404).json({ message: "Refund not found." });
    }
    res.status(200).json(refund);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get refund records for a specific brand (by brandId)
exports.getRefundsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const refunds = await Refund.find({ brandId }).populate(
      "orderId processedBy"
    );
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update a refund record (e.g., status, processedBy)
exports.updateRefund = async (req, res) => {
  try {
    const updatedRefund = await Refund.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("orderId brandId processedBy");
    if (!updatedRefund) {
      return res.status(404).json({ message: "Refund not found." });
    }
    res.status(200).json(updatedRefund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Delete a refund record (admin only or internal use)
exports.deleteRefund = async (req, res) => {
  try {
    const deletedRefund = await Refund.findByIdAndDelete(req.params.id);
    if (!deletedRefund) {
      return res.status(404).json({ message: "Refund not found." });
    }
    res.status(200).json({ message: "Refund deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
