const Policy = require("../models/policy");

// Create a new policy
exports.createPolicy = async (req, res) => {
  try {
    const newPolicy = new Policy(req.body);
    await newPolicy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating policy" });
  }
};

// Get all policies
exports.getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find();
    res.status(200).json(policies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching policies" });
  }
};

// Get a specific policy by type
exports.getPolicyByType = async (req, res) => {
  try {
    const policy = await Policy.findOne({ type: req.params.type });
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.status(200).json(policy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching policy" });
  }
};

// Update a specific policy by type
exports.updatePolicy = async (req, res) => {
  try {
    const updatedPolicy = await Policy.findOneAndUpdate(
      { type: req.params.type },
      req.body,
      { new: true }
    );
    if (!updatedPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.status(200).json(updatedPolicy);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating policy" });
  }
};

// Delete a policy by type
exports.deletePolicy = async (req, res) => {
  try {
    const deletedPolicy = await Policy.findOneAndDelete({
      type: req.params.type,
    });
    if (!deletedPolicy) {
      return res.status(404).json({ message: "Policy not found" });
    }
    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting policy" });
  }
};
