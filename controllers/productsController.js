const Product = require("../models/Products");

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      colors,
      sizes,
      price,
      salePrice,
      tags,
      manufacturer,
      collection,
      type,
      manufactureYear,
      reviews,
      images,
      mainImage,
      technicalDimensions,
      brandId,
      brandName,
      leadTime,
      stock,
      sku,
      warrantyInfo,
      materialCareInstructions,
      productSpecificRecommendations,
      Estimatedtimeleadforcustomization,
      Customizationoptions,
      Additionaldetails,
      Additionalcosts,
      claimProcess,
    } = req.body;

    console.log(req.body);

    const productImages = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price, and category are required" });
    }

    const product = new Product({
      name,
      description,
      category,
      subcategory,
      colors,
      sizes,
      price,
      salePrice,
      tags,
      manufacturer,
      collection,
      type,
      manufactureYear,
      reviews,
      images: productImages,
      mainImage,
      technicalDimensions,
      brandId,
      brandName,
      leadTime,
      stock,
      sku,
      warrantyInfo,
      materialCareInstructions,
      productSpecificRecommendations,
      Estimatedtimeleadforcustomization,
      Customizationoptions,
      Additionaldetails,
      Additionalcosts,
      claimProcess,
      vendor: "placeholderVendorId", // Temporary placeholder vendor ID for testing
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product", error });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      priceMin,
      priceMax,
      tags,
      vendor,
      stockMin,
      stockMax,
      colors,
      sizes,
      manufacturer,
      leadTime,
      sku,
      manufactureYear,
      brandId,
      brandName,
      collection,
      type,
    } = req.query;

    const filter = {};

    // Add filters based on the query parameters
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (priceMin || priceMax) {
      filter.price = {
        ...(priceMin && { $gte: priceMin }),
        ...(priceMax && { $lte: priceMax }),
      };
    }
    if (tags) filter.tags = { $in: tags.split(",") };
    if (vendor) filter.vendor = vendor;
    if (stockMin || stockMax) {
      filter.stock = {
        ...(stockMin && { $gte: stockMin }),
        ...(stockMax && { $lte: stockMax }),
      };
    }
    if (colors) filter.colors = { $in: colors.split(",") };
    if (sizes) filter.sizes = { $in: sizes.split(",") };
    if (manufacturer) filter.manufacturer = manufacturer;
    if (leadTime) filter.leadTime = leadTime;
    if (sku) filter.sku = sku;
    if (manufactureYear) filter.manufactureYear = manufactureYear;
    if (brandId) filter.brandId = brandId;
    if (brandName) filter.brandName = brandName;
    if (collection) filter.collection = collection;
    if (type) filter.type = type;

    // Fetch products based on the filter
    const products = await Product.find(filter)
      .populate("category subcategory vendor type brandId")
      .exec();

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products", error });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Log the received ID to check its value
    console.log("Received product ID:", id);

    // Ensure no unwanted characters in ID (e.g., extra spaces, newlines)
    if (!id || id.trim() === "") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate("category subcategory vendor type brandId")
      .exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId, categoryName } = req.params;

    // Fetch products with the matching category ID
    const products = await Product.find({ category: categoryId })
      .populate("category subcategory vendor type brandId") // Populate related fields if needed
      .exec();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: `No products found for category ${categoryName}` });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res
      .status(500)
      .json({ message: "Error fetching products by category", error });
  }
};

exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId, subcategoryName } = req.params;

    // Fetch products for the specified subcategory
    const products = await Product.find({ subcategory: subcategoryId })
      .populate("subcategory category vendor type brandId") // Adjust population as needed
      .exec();

    if (!products.length) {
      return res.status(404).json({
        message: `No products found for subcategory ${subcategoryName}`,
      });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    res
      .status(500)
      .json({ message: "Error fetching products by subcategory", error });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.files) {
      updates.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
    });
    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product", error });
  }
};
