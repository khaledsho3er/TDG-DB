const BimCadFile = require("../models/bimcad");
const Product = require("../models/Products");

// Create a new BIM/CAD file
exports.createBimCadFile = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const bimCadFile = new BimCadFile({
      productId,
      file: `/uploads/${req.file.filename}`,
    });

    await bimCadFile.save();

    res.status(201).json({ message: "File uploaded successfully", bimCadFile });
  } catch (error) {
    console.error("Error creating BIM/CAD file:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get all BIM/CAD files
exports.getAllBimCadFiles = async (req, res) => {
  try {
    const files = await BimCadFile.find().populate("productId", "name");
    res.status(200).json({ files });
  } catch (error) {
    console.error("Error fetching BIM/CAD files:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Get a BIM/CAD file by ID
exports.getBimCadFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await BimCadFile.findById(id).populate("productId", "name");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(200).json({ file });
  } catch (error) {
    console.error("Error fetching BIM/CAD file by ID:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Update a BIM/CAD file
exports.updateBimCadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    const file = await BimCadFile.findById(id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (productId) {
      const productExists = await Product.findById(productId);
      if (!productExists) {
        return res.status(404).json({ message: "Product not found" });
      }
      file.productId = productId;
    }

    if (req.file) {
      file.file = `/uploads/${req.file.filename}`;
    }

    await file.save();
    res.status(200).json({ message: "File updated successfully", file });
  } catch (error) {
    console.error("Error updating BIM/CAD file:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Delete a BIM/CAD file
exports.deleteBimCadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await BimCadFile.findById(id);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await file.deleteOne();
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting BIM/CAD file:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
