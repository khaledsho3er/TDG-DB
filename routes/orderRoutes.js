const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const upload = require("../middlewares/multerSetup");
const uploadFile = require("../middlewares/multerFiles");
router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/bestsellers", orderController.getBestSellers);
router.get("/order/percentage-change", orderController.getPercentageChange);
router.get("/sales", orderController.getSalesData);
router.get(
  "/vendor/best-sellers/:brandId",
  orderController.getVendorBestSellers
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

module.exports = router;
