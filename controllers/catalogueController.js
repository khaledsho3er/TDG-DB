const Catalogue = require("../models/catalogue");

// Add a new catalogue
exports.addCatalogue = async (req, res) => {
  try {
    const { vendorID, name, year, type } = req.body;

    if (!req.files || !req.files.image || !req.files.pdf) {
      return res.status(400).json({ error: "Image and PDF are required" });
    }

    const newCatalogue = new Catalogue({
      vendorID,
      name,
      year,
      type,
      image: req.files.image[0].filename, // Save filename
      pdf: req.files.pdf[0].filename, // Save filename
    });

    const savedCatalogue = await newCatalogue.save();
    res.status(201).json(savedCatalogue);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error adding catalogue", details: error.message });
  }
};

// Fetch catalogs by vendorID
exports.fetchCataloguesByVendor = async (req, res) => {
  try {
    const { vendorID } = req.params; // Get vendorID from request parameters
    const catalogs = await Catalogue.find({ vendorID }); // Query the database for matching catalogs
    if (!catalogs.length) {
      return res
        .status(404)
        .json({ message: "No catalogs found for this vendor." });
    }
    res.status(200).json(catalogs); // Send the catalogs in response
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching catalogs", details: error.message });
  }
};

// Get all catalogues for a vendor
exports.getCataloguesByVendor = async (req, res) => {
  try {
    const { vendorID } = req.query;
    const catalogues = await Catalogue.find({ vendorID });

    res.status(200).json(catalogues);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching catalogues", details: error.message });
  }
};

// Get a specific catalogue by ID
exports.getCatalogueById = async (req, res) => {
  try {
    const { id } = req.params;
    const catalogue = await Catalogue.findById(id);

    if (!catalogue)
      return res.status(404).json({ error: "Catalogue not found" });

    res.status(200).json(catalogue);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching catalogue", details: error.message });
  }
};

// Update a catalogue
exports.updateCatalogue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedCatalogue = await Catalogue.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedCatalogue)
      return res.status(404).json({ error: "Catalogue not found" });

    res.status(200).json(updatedCatalogue);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating catalogue", details: error.message });
  }
};

// Delete a catalogue
exports.deleteCatalogue = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCatalogue = await Catalogue.findByIdAndDelete(id);

    if (!deletedCatalogue)
      return res.status(404).json({ error: "Catalogue not found" });

    res.status(200).json({ message: "Catalogue deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting catalogue", details: error.message });
  }
};
