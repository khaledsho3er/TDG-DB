const Brand = require("../models/Brand");
const upload = require("../middlewares/multerSetup");

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
    } = req.body;

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
      brandlogo: req.files["brandlogo"] ? req.files["brandlogo"][0].path : null,
      digitalCopiesLogo: req.files["digitalCopiesLogo"]
        ? req.files["digitalCopiesLogo"].map((file) => file.path)
        : [],
      coverPhoto: req.files["coverPhoto"]
        ? req.files["coverPhoto"][0].path
        : null,
      catalogues: req.files["catalogues"]
        ? req.files["catalogues"].map((file) => file.path)
        : [],
      documents: req.files["documents"]
        ? req.files["documents"].map((file) => file.path)
        : [],
    });

    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
