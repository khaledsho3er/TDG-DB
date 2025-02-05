const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/", orderController.getAllOrders);
router.get("/bestsellers", orderController.getBestSellers);
router.get("/:id", orderController.getOrderById);
router.get("/orders/brand/:brandId", orderController.getOrdersByBrand);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);
module.exports = router;
