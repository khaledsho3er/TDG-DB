const ReturnRequest = require("../models/returnsOrder");
const Order = require("../models/order");

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

    order.orderStatus = "Returned";
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
    const { brandStatus } = req.body;

    if (!["Returned", "Not Returned"].includes(brandStatus)) {
      return res.status(400).json({ error: "Invalid brand status" });
    }

    const request = await ReturnRequest.findById(id);
    if (!request)
      return res.status(404).json({ error: "Return request not found" });

    request.brandStatus = brandStatus;
    await request.save();

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

    const request = await ReturnRequest.findById(id);
    if (!request)
      return res.status(404).json({ error: "Return request not found" });

    request.status = status;
    request.adminNote = adminNote;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ message: "Admin status updated", request });
  } catch (err) {
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
