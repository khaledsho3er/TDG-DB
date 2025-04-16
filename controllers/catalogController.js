const Catalog = require("../models/catalog");

exports.createCatalog = async (req, res) => {
  try {
    const { brandId, title, year, model, type } = req.body;
    if (!req.files || !req.files.pdf || !req.files.image) {
      return res.status(400).json({ error: "PDF and Image are required" });
    }

    const pdfUrl = req.files.pdf[0].key;
    const imageUrl = req.files.image[0].key;

    const catalog = new Catalog({
      brandId,
      title,
      year,
      pdf: pdfUrl,
      image: imageUrl,
      model,
      type,
    });

    await catalog.save();
    res.status(201).json(catalog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCatalogs = async (req, res) => {
  try {
    const catalogs = await Catalog.find({ brandId: req.params.brandId });
    res.json(catalogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateCatalog = async (req, res) => {
  try {
    const catalogId = req.params.id;

    const existingCatalog = await Catalog.findById(catalogId);
    if (!existingCatalog) {
      return res.status(404).json({ error: "Catalog not found" });
    }

    const { title, year, model, type } = req.body;

    // Update fields if provided
    if (title) existingCatalog.title = title;
    if (year) existingCatalog.year = year;
    if (model) existingCatalog.model = model;
    if (type) existingCatalog.type = type;

    // Update files if new ones are uploaded
    if (req.files?.pdf?.[0]) {
      existingCatalog.pdf = req.files.pdf[0].key;
    }
    if (req.files?.image?.[0]) {
      existingCatalog.image = req.files.image[0].key;
    }

    await existingCatalog.save();

    res.json({
      message: "Catalog updated successfully",
      catalog: existingCatalog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findByIdAndDelete(req.params.id);
    if (!catalog) return res.status(404).json({ error: "Catalog not found" });

    res.json({ message: "Catalog deleted successfully" });
  } catch (error) {
    console.log("error deleting catalog", error);
    res.status(500).json({ error: error.message });
  }
};
