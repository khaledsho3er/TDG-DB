const Product = require("../models/Products");
const Category = require("../models/category");
const Notification = require("../models/notification");
const mongoose = require("mongoose"); // Import mongoose
const ProductVariant = require("../models/productVariant");
const AdminNotification = require("../models/adminNotifications"); // Import AdminNotification
const Order = require("../models/order");
const Brand = require("../models/Brand");

exports.createProduct = async (req, res) => {
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

    // Convert category, subcategory, and type to ObjectIDs
    if (productData.category) {
      productData.category = new mongoose.Types.ObjectId(productData.category); // Use 'new'
    }
    if (productData.subcategory) {
      productData.subcategory = new mongoose.Types.ObjectId(
        productData.subcategory
      ); // Use 'new'
    }
    if (productData.type) {
      productData.type = new mongoose.Types.ObjectId(productData.type); // Use 'new'
    }

    // Handle image uploads
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map(
        (file) => file.filename || file.key
      );
      console.log("Uploaded image URLs:", imageUrls);
      productData.images = imageUrls;
      productData.mainImage = req.body.mainImage || imageUrls[0];
    } else {
      console.log("No images uploaded");
    }
    // Handle uploaded CAD file
    if (req.files?.cadFile) {
      productData.cadFile =
        req.files.cadFile[0].filename || req.files.cadFile[0].key;
    }

    // Parse nested fields (if sent as JSON strings)
    if (productData.technicalDimensions) {
      productData.technicalDimensions = JSON.parse(
        productData.technicalDimensions
      );
    }
    if (productData.warrantyInfo) {
      productData.warrantyInfo = JSON.parse(productData.warrantyInfo);
    }

    // Ensure reviews is an array of objects
    if (productData.reviews) {
      productData.reviews = JSON.parse(productData.reviews); // Parse the stringified array
    } else {
      productData.reviews = []; // Set to empty array if not provided
    }

    // Handle variants (if present)
    let variantIds = [];
    if (productData.variants) {
      // Create variants and push their IDs
      const variants = JSON.parse(productData.variants); // Parse the variants JSON string
      const variantPromises = variants.map(async (variant) => {
        const newVariant = new ProductVariant({
          size: variant.size,
          color: variant.color,
          price: variant.price,
          quantity: variant.quantity,
          images: variant.images,
          sku: variant.sku,
          available: variant.available,
        });

        const savedVariant = await newVariant.save();
        variantIds.push(savedVariant._id);
      });

      // Wait for all variants to be saved
      await Promise.all(variantPromises);
    }

    // Create the product with variant references (if variants were created)
    const product = new Product({
      ...productData,
      variants: variantIds, // Link the variants to the product
    });

    // Save the product
    await product.save();
    // Create admin notification for product creation
    const adminNotification = new AdminNotification({
      type: "product",
      description: `New product "${product.name} price: ${
        product.price
      }" created by brand ${product.brandId.brandName || product.brandId}`,
      read: false,
    });
    await adminNotification.save();
    // Return the response
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
      stockMin,
      stockMax,
      colors,
      sizes,
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

// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = { ...req.body };
//     // Fetch the existing product
//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     // Reconstruct arrays for colors and sizes
//     if (req.body.colors) {
//       updates.colors = Array.isArray(req.body.colors)
//         ? req.body.colors
//         : Object.values(req.body)
//             .filter((key) => key.startsWith("colors["))
//             .map((key) => req.body[key]);
//     }

//     if (req.body.sizes) {
//       updates.sizes = Array.isArray(req.body.sizes)
//         ? req.body.sizes
//         : Object.values(req.body)
//             .filter((key) => key.startsWith("sizes["))
//             .map((key) => req.body[key]);
//     }
//     // Ensure reviews is an array of objects
//     if (updates.reviews && typeof updates.reviews === "string") {
//       updates.reviews = JSON.parse(updates.reviews);
//       // Convert back to an array if it was stringified
//     }
//     if (updates.technicalDimensions) {
//       updates.technicalDimensions = JSON.parse(updates.technicalDimensions);
//     }
//     // Ensure warrantyInfo is an object
//     if (updates.warrantyInfo && typeof updates.warrantyInfo === "string") {
//       updates.warrantyInfo = JSON.parse(updates.warrantyInfo); // Convert back to an object if it was stringified
//     }

//     // Remove '/uploads/' from existing images if present and filter out invalid values
//     const existingImages = (existingProduct.images || [])
//       .map((img) =>
//         typeof img === "string" ? img.replace(/^\/uploads\//, "") : null
//       )
//       .filter((img) => img && img !== "undefined" && img !== "null");

//     // Only add new valid filenames
//     let newImages = [];
//     if (req.files && req.files.length > 0) {
//       newImages = req.files
//         .map((file) => file.filename)
//         .filter(
//           (filename) =>
//             filename && filename !== "undefined" && filename !== "null"
//         );
//     }

//     updates.images = [...existingImages, ...newImages];

//     // Update mainImage if provided, else keep the current one
//     updates.mainImage = req.body.mainImage || existingProduct.mainImage;

//     // Store updates in pendingUpdates and set updateStatus to 'pending'
//     existingProduct.pendingUpdates = updates;
//     existingProduct.updateStatus = "pending";
//     await existingProduct.save();

//     // Compare current product data with pendingUpdates to find changed fields
//     const changedFields = [];
//     for (let key in updates) {
//       if (
//         Object.prototype.hasOwnProperty.call(existingProduct._doc, key) &&
//         typeof updates[key] !== "object" &&
//         existingProduct[key] !== updates[key]
//       ) {
//         changedFields.push({
//           field: key,
//           oldValue: existingProduct[key],
//           newValue: updates[key],
//         });
//       }
//     }

//     // Build a description for the notification
//     let description = `Product '${existingProduct.name}' submitted changes for approval: `;
//     if (changedFields.length > 0) {
//       description += changedFields
//         .map((f) => {
//           const oldVal =
//             typeof f.oldValue === "object"
//               ? JSON.stringify(f.oldValue)
//               : f.oldValue;
//           const newVal =
//             typeof f.newValue === "object"
//               ? JSON.stringify(f.newValue)
//               : f.newValue;
//           return `${f.field}: "${oldVal}" → "${newVal}"`;
//         })
//         .join(", ");
//     } else {
//       description += "No fields changed.";
//     }

//     const adminNotification = new AdminNotification({
//       type: "Product Update",
//       description: description,
//       read: false,
//     });
//     await adminNotification.save();

//     res.status(200).json({
//       message: "Product update submitted for admin approval.",
//       product: existingProduct,
//     });
//   } catch (error) {
//     console.error("Error updating product:", error);
//     res.status(500).json({ message: "Error updating product", error });
//   }
// };
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Fetch the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Reconstruct arrays for colors and sizes (FIXED)
    if (req.body.colors) {
      updates.colors = Array.isArray(req.body.colors)
        ? req.body.colors
        : Object.keys(req.body) // FIXED: was Object.values
            .filter((key) => key.startsWith("colors["))
            .map((key) => req.body[key]);
    }

    if (req.body.sizes) {
      updates.sizes = Array.isArray(req.body.sizes)
        ? req.body.sizes
        : Object.keys(req.body) // FIXED: was Object.values
            .filter((key) => key.startsWith("sizes["))
            .map((key) => req.body[key]);
    }

    // Reconstruct tags array
    if (req.body.tags) {
      updates.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : Object.keys(req.body)
            .filter((key) => key.startsWith("tags["))
            .map((key) => req.body[key]);
    }

    // Ensure reviews is an array of objects
    if (updates.reviews && typeof updates.reviews === "string") {
      updates.reviews = JSON.parse(updates.reviews);
    }

    // Parse technical dimensions
    if (
      updates.technicalDimensions &&
      typeof updates.technicalDimensions === "string"
    ) {
      updates.technicalDimensions = JSON.parse(updates.technicalDimensions);
    }

    // Ensure warrantyInfo is an object
    if (updates.warrantyInfo && typeof updates.warrantyInfo === "string") {
      updates.warrantyInfo = JSON.parse(updates.warrantyInfo);
    }

    // Handle readyToShip boolean conversion
    if (updates.readyToShip !== undefined) {
      updates.readyToShip =
        updates.readyToShip === "true" || updates.readyToShip === true;
    }

    // Handle image uploads
    const existingImages = (existingProduct.images || [])
      .map((img) =>
        typeof img === "string" ? img.replace(/^\/uploads\//, "") : null
      )
      .filter((img) => img && img !== "undefined" && img !== "null");

    // Process new image uploads
    let newImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      newImages = req.files.images
        .map((file) => file.filename)
        .filter(
          (filename) =>
            filename && filename !== "undefined" && filename !== "null"
        );
    }

    updates.images = [...existingImages, ...newImages];

    // Handle CAD file upload (NEW)
    if (req.files && req.files.cadFile && req.files.cadFile.length > 0) {
      const cadFile = req.files.cadFile[0];
      updates.cadFile = cadFile.filename;
    }

    // Update mainImage if provided, else keep the current one
    updates.mainImage = req.body.mainImage || existingProduct.mainImage;

    // Store updates in pendingUpdates and set updateStatus to 'pending'
    existingProduct.pendingUpdates = updates;
    existingProduct.updateStatus = "pending";
    await existingProduct.save();

    // Compare current product data with pendingUpdates to find changed fields
    const changedFields = [];
    for (let key in updates) {
      if (
        Object.prototype.hasOwnProperty.call(existingProduct._doc, key) &&
        typeof updates[key] !== "object" &&
        existingProduct[key] !== updates[key]
      ) {
        changedFields.push({
          field: key,
          oldValue: existingProduct[key],
          newValue: updates[key],
        });
      }
    }

    // Build a description for the notification
    let description = `Product '${existingProduct.name}' submitted changes for approval: `;
    if (changedFields.length > 0) {
      description += changedFields
        .map((f) => {
          const oldVal =
            typeof f.oldValue === "object"
              ? JSON.stringify(f.oldValue)
              : f.oldValue;
          const newVal =
            typeof f.newValue === "object"
              ? JSON.stringify(f.newValue)
              : f.newValue;
          return `${f.field}: "${oldVal}" → "${newVal}"`;
        })
        .join(", ");
    } else {
      description += "No fields changed.";
    }

    // Create admin notification
    const adminNotification = new AdminNotification({
      type: "Product Update",
      description: description,
      read: false,
    });
    await adminNotification.save();

    res.status(200).json({
      message: "Product update submitted for admin approval.",
      product: existingProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    const productName = product.name;
    const brandName = product.brandId.brandName || product.brandId;

    // Delete the product
    await Product.findByIdAndDelete(id);

    // Create admin notification for product deletion
    const adminNotification = new AdminNotification({
      type: "product_delete",
      description: `Product "${productName}" has been deleted from the system from brand "${brandName}"`,
      read: false,
    });
    await adminNotification.save();
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
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const keywords = query.trim().split(/\s+/).map(escapeRegExp);

    const regexArray = keywords.map((kw) => ({
      $regex: new RegExp(kw, "i"),
    }));

    // Search products
    const productSuggestions = await Product.find(
      {
        $and: [
          { status: true },
          {
            $or: [
              ...regexArray.map((r) => ({ name: r })),
              ...regexArray.map((r) => ({ tags: r })),
              ...regexArray.map((r) => ({ description: r })),
              ...regexArray.map((r) => ({ collection: r })),
              ...regexArray.map((r) => ({ colors: r })),
              ...regexArray.map((r) => ({ sizes: r })),
            ],
          },
        ],
      },
      {
        name: 1,
        price: 1,
        salePrice: 1,
        category: 1,
        subcategory: 1,
        type: 1,
        brandId: 1,
        mainImage: 1,
        tags: 1,
        description: 1,
        collection: 1,
        manufactureYear: 1,
        colors: 1,
        sizes: 1,
      }
    )
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("type", "name")
      .populate("brandId", "brandName brandlogo brandDescription")
      .limit(10); // increased limit to rank later

    // Search brands
    const brandSuggestions = await Brand.find(
      {
        $or: regexArray.map((r) => ({ brandName: r })),
      },
      {
        brandName: 1,
        brandlogo: 1,
        brandDescription: 1,
      }
    ).limit(5);

    // Label results
    const productResults = productSuggestions.map((product) => ({
      ...product.toObject(),
      resultType: "product",
    }));

    const brandResults = brandSuggestions.map((brand) => ({
      ...brand.toObject(),
      resultType: "brand",
    }));

    // Optional: sort productResults by match score (naive approach)
    const scoredProducts = productResults
      .map((product) => {
        let score = 0;
        keywords.forEach((kw) => {
          const r = new RegExp(kw, "i");
          if (r.test(product.name)) score += 4;
          if (r.test(product.tags?.join(" "))) score += 2;
          if (r.test(product.colors?.join(" "))) score += 1;
          if (r.test(product.description)) score += 0.5;
        });
        return { ...product, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    // Merge and limit total results
    const combinedResults = [...scoredProducts, ...brandResults].slice(0, 8);

    res.json(combinedResults);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
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
    // Create admin notification for promotion update
    const adminNotification = new AdminNotification({
      type: "promotion",
      description: `Promotion added to product "${
        product.name
      }" with ${discountPercentage.toFixed(2)}% discount, valid from ${new Date(
        startDate
      ).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      read: false,
    });
    await adminNotification.save();
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
exports.updateProductStatus = async (req, res) => {
  const { productId } = req.params;
  const { status, rejectionNote } = req.body;

  if (typeof status !== "boolean") {
    return res
      .status(400)
      .json({ message: "Status must be a boolean (true or false)." });
  }

  const updateData = { status };

  if (status === false && rejectionNote) {
    updateData.rejectionNote = rejectionNote;
  } else if (status === true) {
    updateData.rejectionNote = undefined; // Clear note if product is accepted
  }

  try {
    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    let description = `Your product "${product.name}" has been ${
      status ? "accepted" : "rejected"
    }.`;
    if (!status && product.rejectionNote) {
      description += ` Reason: ${product.rejectionNote}`;
    }
    // Create a notification for the brand
    const notification = new Notification({
      type: "Product Status",
      description,
      brandId: product.brandId,
    });

    await notification.save();
    res.status(200).json({
      message: `Product ${status ? "accepted" : "rejected"} successfully.`,
      product,
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getPromotionalProducts = async (req, res) => {
  try {
    const productsOnPromotion = await Product.find({
      salePrice: { $exists: true, $ne: null },
      $expr: { $lt: ["$salePrice", "$price"] }, // salePrice < price
    })
      .populate({
        path: "brandId",
        select: "brandName brandLogo",
      })
      .select(
        "name price salePrice discountPercentage promotionStartDate promotionEndDate mainImage stock brandId promotionApproved promotionRejectionNote"
      );

    res.status(200).json(productsOnPromotion);
  } catch (error) {
    console.error("Error fetching promotional products:", error);
    res.status(500).json({ error: "Server error fetching promotions" });
  }
};
exports.getPromotionMetrics = async (req, res) => {
  try {
    const discountedProducts = await Product.find({
      salePrice: { $exists: true, $ne: null },
      $expr: { $lt: ["$salePrice", "$price"] },
      promotionStartDate: { $ne: null },
      promotionEndDate: { $ne: null },
    })
      .populate("brandId", "brandName brandLogo")
      .lean();

    const metrics = [];

    for (const product of discountedProducts) {
      const {
        _id,
        name,
        price,
        salePrice,
        promotionStartDate,
        promotionEndDate,
        brandId,
      } = product;

      // Define periods
      const promoStart = new Date(promotionStartDate);
      const promoEnd = new Date(promotionEndDate);
      const promoDurationMs = promoEnd - promoStart;

      const beforePromoStart = new Date(promoStart - promoDurationMs);

      // 🟢 During Promotion
      const during = await Order.aggregate([
        { $unwind: "$cartItems" },
        {
          $match: {
            "cartItems.productId": _id,
            createdAt: { $gte: promoStart, $lte: promoEnd },
          },
        },
        {
          $group: {
            _id: "$cartItems.productId",
            unitsSold: { $sum: "$cartItems.quantity" },
            turnover: { $sum: "$cartItems.totalPrice" },
          },
        },
      ]);

      // 🔵 Before Promotion (same duration window)
      const before = await Order.aggregate([
        { $unwind: "$cartItems" },
        {
          $match: {
            "cartItems.productId": _id,
            createdAt: { $gte: beforePromoStart, $lt: promoStart },
          },
        },
        {
          $group: {
            _id: "$cartItems.productId",
            unitsSold: { $sum: "$cartItems.quantity" },
            turnover: { $sum: "$cartItems.totalPrice" },
          },
        },
      ]);

      const duringData = during[0] || { unitsSold: 0, turnover: 0 };
      const beforeData = before[0] || { unitsSold: 0, turnover: 0 };

      const uplift =
        beforeData.unitsSold > 0
          ? ((duringData.unitsSold - beforeData.unitsSold) /
              beforeData.unitsSold) *
            100
          : duringData.unitsSold > 0
          ? 100
          : 0;

      metrics.push({
        productId: _id,
        name,
        price,
        salePrice,
        discountPercentage: Math.round(((price - salePrice) / price) * 100),
        brandName: brandId?.brandName || null,
        brandLogo: brandId?.brandLogo || null,
        promotionStartDate: promoStart,
        promotionEndDate: promoEnd,

        // During promotion
        unitsSoldDuring: duringData.unitsSold,
        turnoverDuring: duringData.turnover,

        // Before promotion
        unitsSoldBefore: beforeData.unitsSold,
        turnoverBefore: beforeData.turnover,

        // Comparison
        salesUpliftPercent: uplift.toFixed(2),
      });
    }

    res.status(200).json(metrics);
  } catch (error) {
    console.error("Error calculating promotion metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Approve pending product update
exports.approvePendingUpdate = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.pendingUpdates) {
      return res.status(404).json({ message: "No pending updates found." });
    }
    Object.assign(product, product.pendingUpdates);
    product.pendingUpdates = null;
    product.updateStatus = "approved";
    await product.save();
    // Send notification
    const notification = new Notification({
      type: "Product Update",
      description: `Your product update for '${product.name}' has been approved by the admin.`,
      brandId: product.brandId,
    });
    await notification.save();
    res
      .status(200)
      .json({ message: "Product update approved and applied.", product });
  } catch (error) {
    console.error("Error approving product update:", error);
    res.status(500).json({ message: "Failed to approve product update" });
  }
};

// Reject pending product update
exports.rejectPendingUpdate = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.pendingUpdates) {
      return res.status(404).json({ message: "No pending updates found." });
    }
    product.pendingUpdates = null;
    product.updateStatus = "rejected";
    await product.save();
    // Send notification
    const notification = new Notification({
      type: "Product Update",
      description: `Your product update for '${product.name}' has been rejected by the admin.`,
      brandId: product.brandId,
    });
    await notification.save();
    res.status(200).json({ message: "Product update rejected." });
  } catch (error) {
    console.error("Error rejecting product update:", error);
    res.status(500).json({ message: "Failed to reject product update" });
  }
};

// Get all products with pending updates
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ updateStatus: "pending" });
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching pending products:", error);
    res.status(500).json({ message: "Server error" });
  }
};
