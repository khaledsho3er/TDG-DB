const Product = require("../models/Products");
const Category = require("../models/category");
const mongoose = require("mongoose"); // Import mongoose
const ProductVariant = require("../models/productVariant");

exports.createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract form data from req.body
    const productData = req.body;

    // Reconstruct arrays for colors and sizes
    if (req.body.colors) {
      productData.colors = Array.isArray(req.body.colors)
        ? req.body.colors
        : Object.values(req.body)
            .filter((key) => key.startsWith("colors["))
            .map((key) => req.body[key]);
    }

    if (req.body.sizes) {
      productData.sizes = Array.isArray(req.body.sizes)
        ? req.body.sizes
        : Object.values(req.body)
            .filter((key) => key.startsWith("sizes["))
            .map((key) => req.body[key]);
    }

    // Convert IDs to ObjectIDs
    ["category", "subcategory", "type"].forEach((field) => {
      if (productData[field]) {
        productData[field] = new mongoose.Types.ObjectId(productData[field]);
      }
    });

    // Handle uploaded main product images
    if (req.files?.images?.length > 0) {
      productData.images = req.files.images.map(
        (file) => file.location || file.key
      );
      productData.mainImage = productData.mainImage || productData.images[0];
    }

    // Handle uploaded CAD file
    if (req.files?.cadFile) {
      productData.cadFile =
        req.files.cadFile[0].location || req.files.cadFile[0].key;
    }

    // Parse nested fields if they were sent as JSON strings
    ["technicalDimensions", "warrantyInfo", "reviews"].forEach((field) => {
      if (productData[field] && typeof productData[field] === "string") {
        productData[field] = JSON.parse(productData[field]);
      }
    });

    // Create and save the product
    const product = new Product(productData);
    await product.save({ session });

    // Handle variants if they exist
    const hasVariants =
      productData.hasVariants === true || productData.hasVariants === "true";

    if (hasVariants && req.files) {
      // Process variant images if they exist
      const variantImagesMap = {};
      const variantMainImagesMap = {};

      // Group variant images by their index
      if (req.files.variantImages) {
        req.files.variantImages.forEach((file) => {
          const match = file.fieldname.match(/variantImages\[(\d+)\]/);
          if (match) {
            const index = match[1];
            if (!variantImagesMap[index]) {
              variantImagesMap[index] = [];
            }
            variantImagesMap[index].push(file.location || file.key);
          }
        });
      }

      // Group variant main images by their index
      if (req.files.variantMainImages) {
        req.files.variantMainImages.forEach((file) => {
          const match = file.fieldname.match(/variantMainImages\[(\d+)\]/);
          if (match) {
            const index = match[1];
            variantMainImagesMap[index] = file.location || file.key;
          }
        });
      }

      // Parse variations data
      let variations;
      try {
        variations = JSON.parse(productData.variations);
        if (!Array.isArray(variations)) {
          throw new Error("Variations must be an array");
        }
      } catch (e) {
        throw new Error("Invalid variations data format");
      }

      // Create each variant
      const variantCreationPromises = variations.map(async (variant, index) => {
        // Validate variant data
        if (!variant.price) {
          throw new Error("Each variant must have a price");
        }

        if (variant.salePrice && variant.salePrice >= variant.price) {
          throw new Error("Sale price must be less than regular price");
        }

        // Get images for this variant
        const variantImages = variantImagesMap[index] || [];
        const variantMainImage =
          variantMainImagesMap[index] || variantImages[0] || "";

        // Generate SKU
        const skuParts = [
          "SKU",
          product._id,
          variant.color || "",
          variant.size || "",
          variant.material || "",
          Math.floor(Math.random() * 10000),
        ].filter(Boolean);

        const sku = skuParts.join("-");

        // Create variant
        const newVariant = new ProductVariant({
          parentProduct: product._id,
          color: variant.color,
          material: variant.material,
          size: variant.size,
          price: variant.price,
          salePrice: variant.salePrice,
          images: variantImages,
          mainImage: variantMainImage,
          sku: sku,
          leadTime: variant.leadTime || productData.leadTime || "",
        });

        return newVariant.save({ session });
      });

      await Promise.all(variantCreationPromises);
    }

    await session.commitTransaction();
    res.status(201).json({
      message: "Product created successfully",
      product,
      hasVariants,
      variantCount: hasVariants ? variations.length : 0,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating product:", error);
    res.status(500).json({
      message: error.message || "Error creating product",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    session.endSession();
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

exports.getProductsByCategoryName = async (req, res) => {
  try {
    const { categoryName } = req.params;

    // Fetch category by name
    const category = await Category.findOne({ name: categoryName });

    if (!category) {
      return res
        .status(404)
        .json({ message: `Category ${categoryName} not found` });
    }

    // Fetch products with the matching category ID
    const products = await Product.find({ category: category._id })
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

exports.getProductsByType = async (req, res) => {
  try {
    const { typeId, typeName } = req.params;

    // Fetch products for the specified type
    const products = await Product.find({ type: typeId })
      .populate("subcategory category vendor type brandId") // Adjust as needed
      .exec();

    if (!products.length) {
      return res.status(404).json({
        message: `No products found for type ${typeName}`,
      });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by type:", error);
    res.status(500).json({ message: "Error fetching products by type", error });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    // Reconstruct arrays for colors and sizes
    if (req.body.colors) {
      updates.colors = Array.isArray(req.body.colors)
        ? req.body.colors
        : Object.values(req.body)
            .filter((key) => key.startsWith("colors["))
            .map((key) => req.body[key]);
    }

    if (req.body.sizes) {
      updates.sizes = Array.isArray(req.body.sizes)
        ? req.body.sizes
        : Object.values(req.body)
            .filter((key) => key.startsWith("sizes["))
            .map((key) => req.body[key]);
    }
    // Ensure reviews is an array of objects
    if (updates.reviews && typeof updates.reviews === "string") {
      updates.reviews = JSON.parse(updates.reviews);
      // Convert back to an array if it was stringified
    }
    if (updates.technicalDimensions) {
      updates.technicalDimensions = JSON.parse(updates.technicalDimensions);
    }
    // Ensure warrantyInfo is an object
    if (updates.warrantyInfo && typeof updates.warrantyInfo === "string") {
      updates.warrantyInfo = JSON.parse(updates.warrantyInfo); // Convert back to an object if it was stringified
    }

    if (req.files) {
      updates.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true, // Optional: ensures that the update adheres to the model's validation rules
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

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
// Controller function to get products by brandId
exports.getProductsByBrandId = async (req, res) => {
  let { brandId } = req.params; // Get brandId from the request parameters

  // Trim any whitespace or newline characters from brandId
  brandId = brandId.trim();

  // Check if brandId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(brandId)) {
    return res.status(400).json({ message: "Invalid brandId format" });
  }

  try {
    // Query the database for products that match the brandId
    const products = await Product.find({ brandId: brandId });

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this brand" });
    }

    // Send the products as the response
    res.status(200).json(products);
  } catch (error) {
    // Handle any errors that occur during the query
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error while fetching products" });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]); // Return empty array if no query

    const suggestions = await Product.find(
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { manufacturer: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      },
      {
        name: 1,
        category: 1,
        subcategory: 1,
        type: 1,
        brandId: 1,
        mainImage: 1,
      } // Selecting required fields
    )
      .populate("category", "name") // Populate category and only return name
      .populate("subcategory", "name") // Populate subcategory
      .populate("type", "name") // Populate type
      .populate("brandId", "name") // Populate brand
      .limit(5); // Limit suggestions to 5 results

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching suggestions" });
  }
};
exports.updateProductPromotion = async (req, res) => {
  try {
    const { salePrice, startDate, endDate } = req.body;
    const { id } = req.params; // Get product ID from URL
    if (!salePrice || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "All fields (sale price, start date, end date) are required for a promotion.",
      });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const discountPercentage =
      ((product.price - salePrice) / product.price) * 100;

    product.salePrice = salePrice;
    product.discountPercentage = discountPercentage.toFixed(2);

    product.promotionStartDate = startDate;
    product.promotionEndDate = endDate;

    await product.save();
    res.json({ message: "Promotion updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
exports.getSalesAnalytics = async (req, res) => {
  try {
    // Get total sales for all products
    const salesData = await Product.find({}, "name sales");

    // Calculate total revenue (assuming you store `price` in the product schema)
    const totalRevenue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$sales", "$salePrice"] } }, // sales * price
        },
      },
    ]);

    // Calculate total number of sales across all products
    const totalSalesCount = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$sales" }, // Sum of all sales
        },
      },
    ]);

    res.json({
      totalSalesCount: totalSalesCount[0]?.totalSales || 0,
      totalRevenue: totalRevenue[0]?.totalRevenue || 0,
      products: salesData,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error });
  }
};
exports.getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId, "name sales");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getPastPromotionsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const today = new Date();

    const pastPromotions = await Product.find({
      brandId,
      promotionStartDate: { $exists: true },
      promotionEndDate: { $exists: true, $lt: today },
    }).sort({ promotionEndDate: -1 });

    res.json(pastPromotions);
  } catch (error) {
    console.error("Failed to fetch past promotions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.endPromotionNow = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Clear promotion fields using unset
    await Product.updateOne(
      { _id: id },
      {
        $unset: {
          salePrice: "",
          discountPercentage: "",
          promotionStartDate: "",
          promotionEndDate: "",
        },
        $set: {
          isPromotionActive: false, // if you're using this flag
        },
      }
    );

    const updatedProduct = await Product.findById(id);
    res.json({ message: "Promotion ended", product: updatedProduct });
  } catch (error) {
    console.error("Failed to end promotion:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.calculatePastPromotionMetrics = async (req, res) => {
  try {
    const products = await Product.find({
      promotionEndDate: { $lt: new Date() },
    });

    // Calculate metrics for each product in past promotions
    const metrics = products.map((product) => {
      const salesDuringPromotion = product.sales;
      const viewsDuringPromotion = product.promotionViews; // Add this field to your schema if it doesn't exist
      const turnoverIncrease = (
        ((product.salePrice - product.price) / product.price) *
        100
      ).toFixed(2);

      return {
        productId: product._id,
        salesDuringPromotion,
        viewsDuringPromotion,
        turnoverIncrease,
      };
    });

    res.json(metrics);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error calculating promotion metrics", error });
  }
};
