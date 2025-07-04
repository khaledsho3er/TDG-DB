const express = require("express");
const { signin, googleAuth } = require("../controllers/authController");

const router = express.Router();

// POST route for user sign-in (both Vendor and Employee)
router.post("/signin-emp", signin);

// POST route for Google authentication
router.post("/google", googleAuth);

module.exports = router;
