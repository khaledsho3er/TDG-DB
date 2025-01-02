const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const isAuthenticated = (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Ensure that userId in the session is valid
    if (!mongoose.Types.ObjectId.isValid(req.session.userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    req.user = { id: req.session.userId }; // Make sure it's an ObjectId
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Token is missing or invalid." });
  }
};

module.exports = isAuthenticated;
