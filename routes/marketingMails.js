const express = require("express");
const router = express.Router();
const mailchimpService = require("../utils/mailchimp");

router.post("/abandoned-cart", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await mailchimpService.tagUser(email, "cart-abandoned");
    return res.status(200).json({ message: "Tagged successfully" });
  } catch (error) {
    console.error("❌ Mailchimp tagging failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
