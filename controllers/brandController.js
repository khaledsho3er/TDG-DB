const brand = require("../models/Brand");

exports.createBrand = async (req, res) => {
  try {
    const { body } = req;

    const digitalCopiesLogoPaths = req.files["digitalCopiesLogo"]
      ? req.files["digitalCopiesLogo"].map((file) => `uploads/${file.filename}`)
      : [];

    const cataloguePaths = req.files["catalogues"]
      ? req.files["catalogues"].map((file) => `uploads/${file.filename}`)
      : [];

    const coverPhotoPath = req.files["coverPhoto"]
      ? `uploads/${req.files["coverPhoto"][0].filename}`
      : null;

    const Brand = new Brand({
      ...body,
      digitalCopiesLogo: digitalCopiesLogoPaths,
      catalogues: cataloguePaths,
      coverPhoto: coverPhotoPath,
    });

    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating brand", error: error.message });
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.status(200).json(brands);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching brands", error: error.message });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }
    res.status(200).json(brand);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching brand", error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBrand = await Brand.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedBrand) {
      return res.status(404).json({ message: "brand not found" });
    }
    res.status(200).json(updatedBrand);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating brand", error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (!deletedBrand) {
      return res.status(404).json({ message: "brand not found" });
    }
    res.status(200).json({ message: "brand deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting brand", error: error.message });
  }
};

exports.updateBrandImages = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "brand not found" });
    }

    if (req.files["digitalCopiesLogo"]) {
      const newLogos = req.files["digitalCopiesLogo"].map(
        (file) => `uploads/${file.filename}`
      );
      brand.digitalCopiesLogo.push(...newLogos); // Add new logos
    }

    if (req.files["catalogues"]) {
      const newCatalogues = req.files["catalogues"].map(
        (file) => `uploads/${file.filename}`
      );
      brand.catalogues.push(...newCatalogues); // Add new catalogs
    }

    await brand.save();
    res.status(200).json(brand);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating brand images", error: error.message });
  }
};
