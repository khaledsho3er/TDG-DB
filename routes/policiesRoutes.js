const express = require("express");
const router = express.Router();
const policyController = require("../controllers/policiesController");

// Create a new policy
router.post("/policies", policyController.createPolicy);

// Get all policies
router.get("/policies", policyController.getPolicies);

// Get a specific policy by type
router.get("/policies/:type", policyController.getPolicyByType);

// Update a specific policy by type
router.put("/policies/:type", policyController.updatePolicy);

// Delete a specific policy by type
router.delete("/policies/:type", policyController.deletePolicy);

module.exports = router;
