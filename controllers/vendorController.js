const Vendor = require("../models/vendors");

exports.createVendor = async (req, res) => {
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

    const vendor = new Vendor({
      ...body,
      digitalCopiesLogo: digitalCopiesLogoPaths,
      catalogues: cataloguePaths,
      coverPhoto: coverPhotoPath,
    });

    const savedVendor = await vendor.save();
    res.status(201).json(savedVendor);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating vendor", error: error.message });
  }
};

exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching vendors", error: error.message });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json(vendor);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching vendor", error: error.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedVendor = await Vendor.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json(updatedVendor);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating vendor", error: error.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVendor = await Vendor.findByIdAndDelete(id);
    if (!deletedVendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting vendor", error: error.message });
  }
};

exports.updateVendorImages = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (req.files["digitalCopiesLogo"]) {
      const newLogos = req.files["digitalCopiesLogo"].map(
        (file) => `uploads/${file.filename}`
      );
      vendor.digitalCopiesLogo.push(...newLogos); // Add new logos
    }

    if (req.files["catalogues"]) {
      const newCatalogues = req.files["catalogues"].map(
        (file) => `uploads/${file.filename}`
      );
      vendor.catalogues.push(...newCatalogues); // Add new catalogs
    }

    await vendor.save();
    res.status(200).json(vendor);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating vendor images", error: error.message });
  }
};
