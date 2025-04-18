const Brand = require("../models/Brand");
const Type = require("../models/types");
const upload = require("../middlewares/brandMulterSetup");

// Create a new brand
exports.createBrand = async (req, res) => {
  try {
    const {
      brandName,
      commercialRegisterNo,
      taxNumber,
      companyAddress,
      phoneNumber,
      email,
      bankAccountNumber,
      websiteURL,
      instagramURL,
      facebookURL,
      tiktokURL,
      linkedinURL,
      shippingPolicy,
      brandDescription,
      fees,
      types, // Array of type IDs
    } = req.body;

    console.log("Types received:", types);

    // Validate types and ensure they exist
    let typeIds = [];
    if (types && Array.isArray(types)) {
      try {
        typeIds = await Type.find({ _id: { $in: types } }).select("_id");
        console.log("Found types:", typeIds);
        typeIds = typeIds.map((type) => type._id); // Extract only valid IDs
      } catch (typeError) {
        console.error("Error finding types:", typeError);
        throw new Error(`Error validating types: ${typeError.message}`);
      }
    }

    console.log("Final typeIds:", typeIds);

    const brand = new Brand({
      brandName,
      commercialRegisterNo,
      taxNumber,
      companyAddress,
      phoneNumber,
      email,
      bankAccountNumber,
      websiteURL,
      instagramURL,
      facebookURL,
      tiktokURL,
      linkedinURL,
      shippingPolicy,
      brandDescription,
      fees,
      types: typeIds, // Associate types with the brand
      brandlogo: req.files["brandlogo"] ? req.files["brandlogo"][0].key : null,
      digitalCopiesLogo: req.files["digitalCopiesLogo"]
        ? req.files["digitalCopiesLogo"].map((file) => file.filename)
        : [],
      coverPhoto: req.files["coverPhoto"]
        ? req.files["coverPhoto"][0].key
        : null,
      catalogues: req.files["catalogues"]
        ? req.files["catalogues"].map((file) => file.filename)
        : [],
      documents: req.files["documents"]
        ? req.files["documents"].map((file) => file.filename)
        : [],
    });

    console.log("Brand object created:", brand);

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    console.error("Error in createBrand:", error);
    res.status(400).json({
      message: error.message,
      stack: error.stack,
      details: error,
    });
  }
};

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a brand by ID
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updates = req.body;
    if (req.files["brandlogo"]) {
      updates.brandlogo = req.files["brandlogo"][0].path;
    }
    if (req.files["digitalCopiesLogo"]) {
      updates.digitalCopiesLogo = req.files["digitalCopiesLogo"].map(
        (file) => file.path
      );
    }
    if (req.files["coverPhoto"]) {
      updates.coverPhoto = req.files["coverPhoto"][0].path;
    }
    if (req.files["catalogues"]) {
      updates.catalogues = req.files["catalogues"].map((file) => file.path);
    }
    if (req.files["documents"]) {
      updates.documents = req.files["documents"].map((file) => file.path);
    }

    Object.assign(brand, updates);
    await brand.save();
    res.status(200).json(brand);
  } catch (error) {
    console.error("Error in updateBrand:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete a brand by ID
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }
    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get brands by status
exports.getBrandsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const brands = await Brand.find({ status });

    if (!brands.length) {
      return res
        .status(404)
        .json({ message: "No brands found for this status" });
    }

    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateBrandMedia = async (req, res) => {
  try {
    const brandId = req.params.id;
    const existingBrand = await Brand.findById(brandId);
    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updateFields = req.body;

    if (req.files?.brandlogo) {
      updateFields.brandLogo = req.files.brandlogo[0].filename;
    }

    if (req.files?.coverPhoto) {
      updateFields.coverPhoto = req.files.coverPhoto[0].filename;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json(updatedBrand);
  } catch (err) {
    console.error("Error updating brand media:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateBrandStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.status = status;
    await brand.save();

    res
      .status(200)
      .json({ message: `Brand status updated to ${status}`, brand });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
