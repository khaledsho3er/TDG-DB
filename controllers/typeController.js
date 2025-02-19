const Type = require("../models/types");

exports.createType = async (req, res) => {
  try {
    const { name, description, subCategoryId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !subCategoryId) {
      return res
        .status(400)
        .json({ message: "Name and SubCategory ID are required" });
    }

    const type = new Type({ name, description, image, subCategoryId });
    await type.save();
    res.status(201).json({ message: "Type created successfully", type });
  } catch (error) {
    res.status(500).json({ message: "Error creating type", error });
  }
};

exports.getTypes = async (req, res) => {
  try {
    const types = await Type.find().populate("subCategoryId", "name");
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: "Error fetching types", error });
  }
};
exports.getTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await Type.findById(id); // Fetch type without populating subCategoryId

    if (!type) {
      return res.status(404).json({ message: "Type not found" });
    }

    res.status(200).json(type); // Return the type without populated subCategoryId
  } catch (error) {
    console.error("Error fetching type:", error);
    res
      .status(500)
      .json({ message: "Error fetching type", error: error.message });
  }
};

exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subCategoryId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedType = await Type.findByIdAndUpdate(
      id,
      { name, description, image, subCategoryId },
      { new: true }
    );

    res.status(200).json({ message: "Type updated", updatedType });
  } catch (error) {
    res.status(500).json({ message: "Error updating type", error });
  }
};

exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;
    await Type.findByIdAndDelete(id);
    res.status(200).json({ message: "Type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting type", error });
  }
};


exports.getTypesBySubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const types = await Type.find({ subCategory: subCategoryId });

    if (!types.length) {
      return res.status(404).json({ message: "No types found for this subcategory" });
    }

    res.json(types);
  } catch (error) {
    console.error("Error fetching types:", error);
    res.status(500).json({ message: "Server error" });
  }
};

