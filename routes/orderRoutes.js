const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Create an order
router.post("/create", orderController.createOrder);

// Get all orders
router.get("/", orderController.getAllOrders);

// Get an order by ID
router.get("/:orderId", orderController.getOrderById);

// Update an order (status, shipping, etc.)
router.put("/:orderId", orderController.updateOrder);

// Delete an order
router.delete("/:orderId", orderController.deleteOrder);

module.exports = router;
