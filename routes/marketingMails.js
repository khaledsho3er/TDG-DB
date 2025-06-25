const express = require("express");
const router = express.Router();
const { tagUser, addContactToAudience } = require("../utils/mailchimp");

router.post("/abandoned-cart", async (req, res) => {
  const { email, firstName, lastName } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    // Add the user to the audience if not already present
    await addContactToAudience(email, firstName, lastName);

    // Now tag the user
    await tagUser(email, "Cart-Abandonment-Email");
    res.status(200).json({ message: "Tagged as cart-abandoned" });
  } catch (error) {
    console.error("Error tagging user:", error);
    res
      .status(500)
      .json({ error: "Failed to tag user", details: error.message });
  }
});

module.exports = router;
