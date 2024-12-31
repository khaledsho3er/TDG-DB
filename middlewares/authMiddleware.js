const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Token is missing or invalid." });
  }
};

module.exports = isAuthenticated;
