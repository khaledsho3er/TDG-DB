const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const orderController = require("../controllers/orderController");
const upload = require("../middlewares/multerSetup");
const uploadFile = require("../middlewares/multerFiles");
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/admin-orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "firstName lastName email")
      .populate("cartItems.productId", "name price")
      .populate("cartItems.brandId", "brandName");

    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
router.get("/bestsellers", orderController.getBestSellers);
router.get("/order/percentage-change", orderController.getPercentageChange);
router.get("/sales", orderController.getSalesData);
router.get(
  "/vendor/best-sellers/:brandId",
  orderController.getVendorBestSellers
);
router.get(
  "/brands/:brandId/accounting/sales-and-earnings",
  orderController.getBrandSalesAndEarnings
);
router.get("/sales-graph/:brandId", orderController.getSalesGraphDataByBrand);
router.get("/statistics/:brandId", orderController.getOrderStatisticsByBrand);
router.get("/:id", orderController.getOrderById);
router.get(
  "/orders/customer/:customerId",
  orderController.getOrdersByCustomerId
);
router.get("/orders/brand/:brandId", orderController.getOrdersByBrand);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
router.put("/update-delivery/:orderId", orderController.updateDeliveryDate);
router.put(
  "/upload-file/:orderId",
  uploadFile.single("file"),
  orderController.uploadFileAndUpdateOrder
);
router.put(
  "/orders/:orderId/cart-items/:cartItemId/delivery-date",
  orderController.updateCartItemDeliveryDate
);
router.put("/orders/:orderId/note", orderController.addOrderNote);
router.post("/ping-brand", orderController.pingBrandOnOrder);
router.put("/:orderId/payment-status", orderController.updatePaymentStatus);

module.exports = router;
