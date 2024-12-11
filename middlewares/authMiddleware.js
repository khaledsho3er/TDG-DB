const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  // Get token from Authorization header
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token part after "Bearer "

  if (!token) {
    return res.status(401).json({ message: "Token is missing or invalid." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret
    req.user = decoded; // Attach decoded user info to request object
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Token is missing or invalid." });
  }
};

module.exports = isAuthenticated;
