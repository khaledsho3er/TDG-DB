// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/adminAuthMiddleware"); // Optional auth

router.post("/register", adminController.signupAdmin);
router.post("/login", adminController.loginAdmin);
router.get("/profile", authMiddleware, adminController.getAdminProfile);
//get all admins
router.get("/all-admins", authMiddleware, adminController.getAllAdmins);

module.exports = router;
