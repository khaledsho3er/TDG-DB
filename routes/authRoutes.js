const express = require("express");
const { signin } = require("../controllers/authController");

const router = express.Router();

// POST route for user sign-in (both Vendor and Employee)
router.post("/signin-emp", signin);

module.exports = router;
