const ViewInStore = require("../models/viewInStore");

// Create a new viewInStore entry
const createViewInStore = async (req, res) => {
  try {
    const { code, productId, userId, userName, brandId, status } = req.body;

    const newViewInStore = new ViewInStore({
      code,
      productId,
      userId,
      userName,
      brandId,
      status,
    });

    const savedViewInStore = await newViewInStore.save();
    res.status(201).json(savedViewInStore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all viewInStore entries
const getAllViewInStore = async (req, res) => {
  try {
    const viewInStoreEntries = await ViewInStore.find()
      .populate("productId")
      .populate("userId")
      .populate("brandId");
    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single viewInStore entry by ID
const getViewInStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewInStoreEntry = await ViewInStore.findById(id)
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    if (!viewInStoreEntry) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    res.status(200).json(viewInStoreEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a viewInStore entry by ID
const updateViewInStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, productId, userId, userName, brandId, status } = req.body;

    const updatedViewInStore = await ViewInStore.findByIdAndUpdate(
      id,
      { code, productId, userId, userName, brandId, status },
      { new: true }
    );

    if (!updatedViewInStore) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    res.status(200).json(updatedViewInStore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a viewInStore entry by ID
const deleteViewInStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedViewInStore = await ViewInStore.findByIdAndDelete(id);

    if (!deletedViewInStore) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    res.status(200).json({ message: "ViewInStore entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all viewInStore entries by brandId
const getViewInStoreByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params;
    const viewInStoreEntries = await ViewInStore.find({ brandId })
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all viewInStore entries by userId
const getViewInStoreByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewInStoreEntries = await ViewInStore.find({ userId })
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createViewInStore,
  getAllViewInStore,
  getViewInStoreById,
  updateViewInStore,
  deleteViewInStore,
  getViewInStoreByBrandId,
  getViewInStoreByUserId,
};
