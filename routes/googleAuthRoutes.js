const express = require("express");
const {
  googleAuth,
  testUserCreation,
  checkAllUsers,
} = require("../controllers/authController");

const router = express.Router();

// Simple test route
router.get("/test", (req, res) => {
  console.log("Google auth test route called");
  res.json({ message: "Google auth routes are working" });
});

// POST route for Google authentication
router.post("/google", googleAuth);

// Test route to verify User model
router.get("/test-user-creation", testUserCreation);

// Route to check all users in database
router.get("/check-users", checkAllUsers);

module.exports = router;
