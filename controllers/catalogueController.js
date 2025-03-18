const Catalog = require("../models/Catalogue");

exports.createCatalog = async (req, res) => {
  try {
    const { brandId, title, year, model, type } = req.body;
    if (!req.files || !req.files.pdf || !req.files.image) {
      return res.status(400).json({ error: "PDF and Image are required" });
    }

    const pdfUrl = req.files.pdf[0].location;
    const imageUrl = req.files.image[0].location;

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

exports.deleteCatalog = async (req, res) => {
  try {
    const catalog = await Catalog.findByIdAndDelete(req.params.id);
    if (!catalog) return res.status(404).json({ error: "Catalog not found" });

    res.json({ message: "Catalog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
