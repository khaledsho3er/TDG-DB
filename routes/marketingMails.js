const express = require("express");
const router = express.Router();
const { tagUser } = require("../utils/mailchimp");

router.post("/abandoned-cart", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    await tagUser(email, "cart-abandoned");
    res.status(200).json({ message: "Tagged as cart-abandoned" });
  } catch (error) {
    console.error("Error tagging user:", error);
    res.status(500).json({ error: "Failed to tag user" });
  }
});

module.exports = router;
