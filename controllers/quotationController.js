// controllers/quotationController.js
const Quotation = require("../models/quotation");
const User = require("../models/user"); // Assuming you have a 'User' model
const Product = require("../models/Products"); // Assuming you have a 'Product' model
const Brand = require("../models/Brand"); // Assuming you have a 'Brand' model
const Notification = require("../models/notification"); // Import the Notification model
const AdminNotification = require("../models/adminNotifications"); // Import the AdminNotification model

// Create a new quotation request
exports.createQuotation = async (req, res) => {
  try {
    const { userId, brandId, productId, material, size, color, customization } =
      req.body;

    // Validate the incoming data
    if (!userId || !brandId || !productId || !material || !size || !color) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Fetch user to get the full name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Create the quotation
    const newQuotation = new Quotation({
      userId,
      brandId,
      productId,
      material,
      size,
      color,
      customization,
    });

    // Save the quotation to the database
    const savedQuotation = await newQuotation.save();
    const newNotification = new Notification({
      type: "quotation",
      description: `You have received a new Quotation from customer ${user.firstName} ${user.lastName} (${userId}).`,
      brandId, // Associate this notification with the brand
      quotation: savedQuotation._id,
      read: false,
    });
    await newNotification.save();
    // Create admin notification for the new quotation
    const adminNotification = new AdminNotification({
      type: "quotation",
      description: `New quotation request from ${user.firstName} ${user.lastName} (${userId}) for product ID: ${productId} from brand ID: ${brandId}`,
      read: false,
    });
    await adminNotification.save();

    res.status(201).json({
      message: "Quotation created successfully",
      quotation: savedQuotation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating quotation", error });
  }
};

// Get all quotations (example of a read operation)
exports.getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("userId")
      .populate("brandId")
      .populate("productId");
    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotations", error });
  }
};
// Get quotations by brandId
exports.getQuotationsByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params; // Get the brandId from the URL params

    // Find quotations for the given brandId
    const quotations = await Quotation.find({ brandId })
      .populate("userId")
      .populate("productId");

    if (quotations.length === 0) {
      return res
        .status(404)
        .json({ message: "No quotations found for this brand" });
    }

    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotations", error });
  }
};
