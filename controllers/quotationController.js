// controllers/quotationController.js
const Quotation = require("../models/quotation");
const User = require("../models/user"); // Assuming you have a 'User' model
const Product = require("../models/Products"); // Assuming you have a 'Product' model
const Brand = require("../models/Brand"); // Assuming you have a 'Brand' model
const Notification = require("../models/notification"); // Import the Notification model
const AdminNotification = require("../models/adminNotifications"); // Import the AdminNotification model
const { sendEmail } = require("../services/awsSes"); // Import AWS SES email sender

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
// Vendor updates quotation with invoice, note, quotePrice, dateOfQuotePrice
exports.updateQuotationByVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, quotePrice, dateOfQuotePrice } = req.body;

    // Handle file upload
    let quotationInvoice;
    if (req.file) {
      quotationInvoice = req.file.key;
    }

    const updateFields = {
      note,
      quotePrice,
      dateOfQuotePrice,
    };

    if (quotationInvoice) {
      updateFields.quotationInvoice = quotationInvoice;
    }

    const updated = await Quotation.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Fetch user to get email
    const user = await User.findById(updated.userId);
    // Fetch product details for richer email
    let product = null;
    if (updated.productId) {
      product = await Product.findById(updated.productId);
    }
    if (user && user.email) {
      // Construct invoice link if present
      let invoiceLink = null;
      if (updated.quotationInvoice) {
        const baseUrl = "https://pub-64ea2c5c4ba5460991425897a370f20c.r2.dev/";
        invoiceLink = `${baseUrl}/${updated.quotationInvoice}`;
      }
      // Format date
      let formattedDate = updated.dateOfQuotePrice
        ? new Date(updated.dateOfQuotePrice).toLocaleDateString()
        : "N/A";
      // Compose email body with more details
      let emailBody = `
        <h2>Your Quotation Has Been Updated</h2>
        ${product ? `<p><strong>Product:</strong> ${product.name}</p>` : ""}
        <p><strong>Material:</strong> ${updated.material || "-"}</p>
        <p><strong>Size:</strong> ${updated.size || "-"}</p>
        <p><strong>Color:</strong> ${updated.color || "-"}</p>
        <p><strong>Customization:</strong> ${updated.customization || "-"}</p>
        <p><strong>Note from Vendor:</strong> ${updated.note || "-"}</p>
        <p><strong>Quote Price:</strong> ${
          updated.quotePrice != null ? updated.quotePrice + " E£" : "-"
        }</p>
        <p><strong>Date of Quote Price:</strong> ${formattedDate}</p>
        ${
          invoiceLink
            ? `<p><strong>Quotation Invoice:</strong> <a href='${invoiceLink}' target='_blank'>View Invoice</a></p>`
            : ""
        }
        <hr>
        <p>If you have any questions, please contact us.</p>
      `;
      try {
        await sendEmail({
          to: user.email,
          subject: "Your Quotation Has Been Updated",
          body: emailBody,
        });
      } catch (emailErr) {
        console.error("Failed to send quotation update email:", emailErr);
        // Optionally, you can continue or return an error here
      }
    }

    res.status(200).json({
      message: "Quotation updated successfully",
      quotation: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating quotation", error });
  }
};
exports.getQuotationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from the URL params

    // Find quotations for the given userId
    const quotations = await Quotation.find({ userId })
      .populate("userId")
      .populate("productId");

    if (quotations.length === 0) {
      return res
        .status(404)
        .json({ message: "No quotations found for this user" });
    }

    res.status(200).json(quotations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotations", error });
  }
};

// Get single quotation by ID, with populated brand info
exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findById(id)
      .populate("brandId", "brandName brandLogo email brandPhone")
      .populate("userId")
      .populate("productId");

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching quotation", error });
  }
};
exports.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Quotation.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting quotation", error });
  }
};
exports.toggleClientApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Toggle the client approval
    quotation.ClientApproval = !quotation.ClientApproval;

    // Set status accordingly
    if (!quotation.ClientApproval) {
      quotation.status = "rejected";
    } else {
      quotation.status = "pending";
    }

    await quotation.save();

    // Notify the brand about the client's action
    try {
      // Fetch user details for notification message
      const user = await User.findById(quotation.userId);
      let clientName = user ? `${user.firstName} ${user.lastName}` : "A client";
      let action = quotation.ClientApproval ? "approved" : "rejected";
      const newNotification = new Notification({
        type: "quotation",
        description: `The client ${clientName} has ${action} the quotation (ID: ${quotation._id}).`,
        brandId: quotation.brandId,
        quotation: quotation._id,
        read: false,
      });
      await newNotification.save();
    } catch (notifErr) {
      console.error(
        "Failed to create brand notification for client approval/rejection:",
        notifErr
      );
    }

    res.status(200).json({
      message: `Client approval set to ${quotation.ClientApproval}`,
      quotation,
    });
  } catch (error) {
    res.status(500).json({ message: "Error toggling client approval", error });
  }
};
exports.vendorApproveQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!quotation.ClientApproval) {
      return res.status(400).json({
        message: "Cannot approve. Client must approve the quotation first.",
      });
    }

    quotation.vendorApproval = true;
    quotation.status = "approved";

    await quotation.save();

    // Send email to user notifying vendor approval and waiting for user approval/payment
    try {
      // Fetch user and product details
      const user = await User.findById(quotation.userId);
      let product = null;
      if (quotation.productId) {
        product = await Product.findById(quotation.productId);
      }
      if (user && user.email) {
        let emailBody = `
          <h2>Your Quotation Has Been Accepted by the Vendor</h2>
          ${product ? `<p><strong>Product:</strong> ${product.name}</p>` : ""}
          <p><strong>Quote Price:</strong> ${
            quotation.quotePrice != null ? quotation.quotePrice + " E£" : "-"
          }</p>
          <p>The vendor has accepted your quotation request. Please review the offer and proceed with your approval and payment to continue the process.</p>
          <hr>
          <p>If you have any questions, please contact us.</p>
        `;
        await sendEmail({
          to: user.email,
          subject: "Vendor Accepted Your Quotation - Action Required",
          body: emailBody,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send vendor approval email to user:", emailErr);
    }

    res.status(200).json({
      message: "Quotation approved by vendor",
      quotation,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating vendor approval", error });
  }
};
