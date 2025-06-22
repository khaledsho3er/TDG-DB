// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middlewares/adminAuthMiddleware"); // Optional auth

router.post("/register", adminController.signupAdmin);
router.post("/login", adminController.loginAdmin);
router.get("/profile", authMiddleware, adminController.getAdminProfile);
//get all admins
router.get("/all-admins", adminController.getAllAdmins);
// Update admin profile
router.put("/profile/:id", adminController.updateAdmin);
// Delete admin profile
router.delete("/profile/:id", adminController.deleteAdmin);

module.exports = router;
