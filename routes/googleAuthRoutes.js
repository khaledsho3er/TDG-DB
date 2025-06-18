const express = require("express");
const { googleAuth } = require("../controllers/authController");

const router = express.Router();

// POST route for Google authentication
router.post("/google", googleAuth);

module.exports = router;
