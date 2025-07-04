const User = require("../models/user");

const isAuthenticated = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // Attach user object to request
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Role-based authorization
const isAuthorized = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Unauthorized access" });
  }
  next();
};

// Employee tier-based authorization
const checkTier = (requiredTier) => (req, res, next) => {
  if (req.user.role !== "Employee" || req.user.authorityTier < requiredTier) {
    return res
      .status(403)
      .json({ message: "Unauthorized access for your tier" });
  }
  next();
};

module.exports = { isAuthenticated, isAuthorized, checkTier };
