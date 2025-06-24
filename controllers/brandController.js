const Brand = require("../models/Brand");
const Type = require("../models/types");
const Order = require("../models/order");
const upload = require("../middlewares/brandMulterSetup");
const Notification = require("../models/notification");
const AdminNotification = require("../models/adminNotifications");
const mongoose = require("mongoose");
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
    const brands = await Brand.find().populate("types", "name description");
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single brand by ID
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate(
      "types",
      "name description"
    );
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
    brand.pendingUpdates = updates;
    brand.updateStatus = "pending";
    await brand.save();

    // Notify admin of changes
    // Compare current brand data with pendingUpdates to find changed fields
    const changedFields = [];
    for (let key in updates) {
      // Only compare if the field exists on the brand and is not an object/array (for simplicity)
      if (
        Object.prototype.hasOwnProperty.call(brand._doc, key) &&
        typeof updates[key] !== "object" &&
        brand[key] !== updates[key]
      ) {
        changedFields.push({
          field: key,
          oldValue: brand[key],
          newValue: updates[key],
        });
      }
    }

    // Build a description for the notification
    let description = `Brand '${brand.brandName}' submitted changes for approval: `;
    if (changedFields.length > 0) {
      description += changedFields
        .map((f) => `${f.field}: \"${f.oldValue}\" → \"${f.newValue}\"`)
        .join(", ");
    } else {
      description += "No fields changed.";
    }

    const adminNotification = new AdminNotification({
      type: "Brand Update",
      description: description,
      read: false,
    });
    await adminNotification.save();

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
    const brands = await Brand.find({ status }).populate(
      "types",
      "name description"
    );

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
// Update brand logo and cover photo
const path = require("path");

exports.updateBrandImages = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.files["brandlogo"] && req.files["brandlogo"][0]) {
      const fullUrl = req.files["brandlogo"][0].location;
      updateData.brandlogo = path.basename(fullUrl); // Get only the filename
    }

    if (req.files["coverPhoto"] && req.files["coverPhoto"][0]) {
      const fullUrl = req.files["coverPhoto"][0].location;
      updateData.coverPhoto = path.basename(fullUrl); // Get only the filename
    }

    const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res
      .status(200)
      .json({ message: "Images updated successfully", brand: updatedBrand });
  } catch (error) {
    console.error("Error updating brand images:", error);
    res.status(500).json({ message: "Server error while updating images" });
  }
};
exports.getBrandFinancialData = async (req, res) => {
  try {
    const { id } = req.params;
    const { range } = req.query;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const matchConditions = {
      "cartItems.brandId": new mongoose.Types.ObjectId(id),
    };

    const now = new Date();
    let fromDate;

    if (range === "7d") {
      fromDate = new Date(now.setDate(now.getDate() - 7));
    } else if (range === "1m") {
      fromDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (range === "1y") {
      fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    if (fromDate) {
      matchConditions.createdAt = { $gte: fromDate };
    }

    const salesByDate = await Order.aggregate([
      { $unwind: "$cartItems" },
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalSales: {
            $sum: {
              $multiply: ["$cartItems.price", "$cartItems.quantity"],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate the total sales from salesByDate
    const totalSales = salesByDate.reduce(
      (sum, item) => sum + item.totalSales,
      0
    );

    const financialData = {
      totalSales,
      salesByDate: salesByDate.map((entry) => ({
        date: entry._id,
        amount: entry.totalSales,
      })),
      commissionRate: brand.commissionRate || 0.15,
      taxRate: brand.taxRate || 0.14,
      fees: brand.fees || 0,
    };

    res.status(200).json(financialData);
  } catch (error) {
    console.error("Error getting brand financial data:", error);
    res.status(500).json({ message: error.message });
  }
};
// Edit (Update) a Brand
exports.adminUpdateBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    // Get the existing brand from the database
    const existingBrand = await Brand.findById(brandId);

    if (!existingBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const updatedData = { ...req.body };

    // Always preserve the old brandlogo and coverPhoto
    updatedData.digitalCopiesLogo = existingBrand.digitalCopiesLogo;
    updatedData.catalogues = existingBrand.catalogues;
    updatedData.documents = existingBrand.documents;
    updatedData.createdAt = existingBrand.createdAt;
    updatedData.updatedAt = existingBrand.updatedAt;
    updatedData.types = existingBrand.types;
    if (req.files?.brandlogo) {
      updatedData.brandLogo = req.files.brandlogo[0].filename;
    }

    if (req.files?.coverPhoto) {
      updatedData.coverPhoto = req.files.coverPhoto[0].filename;
    }
    // Detect what fields have changed
    const changedFields = [];
    for (let key in updatedData) {
      if (updatedData[key] != existingBrand[key]) {
        changedFields.push(key);
      }
    }
    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updatedData, {
      new: true,
      runValidators: true, // optional: validates the schema while updating
    });

    // Build notification message
    let description = "";
    if (changedFields.length > 0) {
      const changedFieldsWithValues = changedFields.map((key) => {
        return `${key}: ${updatedData[key]}`;
      });
      description = `The Admin of TDG updated the following fields in your brand data: ${changedFieldsWithValues.join(
        ", "
      )}.`;
    } else {
      description = "The Admin of TDG made changes to your brand data.";
    }

    // Create a notification
    const notification = new Notification({
      type: "Brand Data Updated",
      description,
      brandId: brandId,
    });

    await notification.save();
    res.status(200).json(updatedBrand);
  } catch (error) {
    console.error("Error updating brand:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a Brand
exports.adminDeleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    const deletedBrand = await Brand.findByIdAndDelete(brandId);

    if (!deletedBrand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error deleting brand:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all active brands
exports.getActiveBrands = async (req, res) => {
  try {
    const activeBrands = await Brand.find({ status: "active" })
      .populate("types", "name description")
      .sort({ brandName: 1 }); // Sort alphabetically by brand name

    if (!activeBrands.length) {
      return res.status(404).json({ message: "No active brands found" });
    }

    res.status(200).json(activeBrands);
  } catch (error) {
    console.error("Error fetching active brands:", error);
    res.status(500).json({
      message: "Error fetching active brands",
      error: error.message,
    });
  }
};

// Get types assigned to a brand
exports.getBrandTypes = async (req, res) => {
  try {
    const { brandId } = req.params;

    // Find the brand
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Get the type IDs from the brand
    const typeIds = brand.types;

    if (!typeIds || typeIds.length === 0) {
      return res.status(200).json({
        message: "This brand has no types assigned",
        types: [],
      });
    }

    // Fetch the full type objects
    const types = await Type.find({
      _id: { $in: typeIds },
    }).select("name description image");

    res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching brand types:", error);
    res.status(500).json({
      message: "Error fetching brand types",
      error: error.message,
    });
  }
};
exports.approvePendingUpdate = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand || !brand.pendingUpdates) {
      return res.status(404).json({ message: "No pending updates found." });
    }

    Object.assign(brand, brand.pendingUpdates);
    brand.pendingUpdates = null;
    brand.updateStatus = "approved";

    await brand.save();
    // Send notification
    const notification = new Notification({
      type: "Brand Update",
      description: "Your brand update has been approved by the admin.",
      brandId: brand._id,
    });
    await notification.save();
    res
      .status(200)
      .json({ message: "Brand update approved and applied.", brand });
  } catch (error) {
    console.error("Error approving update:", error);
    res.status(500).json({ message: "Failed to approve update" });
  }
};
exports.rejectPendingUpdate = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand || !brand.pendingUpdates) {
      return res.status(404).json({ message: "No pending updates found." });
    }

    brand.pendingUpdates = null;
    brand.updateStatus = "rejected";

    await brand.save();
    // Send notification
    const notification = new Notification({
      type: "Brand Update",
      description: "Your brand update has been rejected by the admin.",
      brandId: brand._id,
    });
    await notification.save();

    res.status(200).json({ message: "Brand update rejected." });
  } catch (error) {
    console.error("Error rejecting update:", error);
    res.status(500).json({ message: "Failed to reject update" });
  }
};
exports.getPendingBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ updateStatus: "pending" }).populate(
      "types",
      "name description"
    );
    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching pending brands:", error);
    res.status(500).json({ message: "Server error" });
  }
};
