const express = require("express");
const { tagAbandonedCart } = require("../utils/mailchimp");

const router = express.Router();

router.post("/abandoned-cart", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    await tagAbandonedCart(email);
    return res.status(200).json({ message: "User tagged with cart-abandoned" });
  } catch (error) {
    console.error("Error tagging abandoned cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
