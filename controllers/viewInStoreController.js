const ViewInStore = require("../models/viewInStore");
const User = require("../models/user");
const { sendEmail } = require("../services/awsSes");
const Brand = require("../models/Brand");
const AdminNotification = require("../models/adminNotifications");
const Notification = require("../models/notification");

// Create a new viewInStore entry
const createViewInStore = async (req, res) => {
  try {
    const { code, productId, userId, userName, brandId, status } = req.body;

    const newViewInStore = new ViewInStore({
      code,
      productId,
      userId,
      userName,
      brandId,
      status,
    });

    const savedViewInStore = await newViewInStore.save();

    // Notify the brand that a user requested a view in store
    try {
      const user = await User.findById(userId);
      const brand = await Brand.findById(brandId);
      let product = null;
      try {
        product = await require("../models/Products").findById(productId);
      } catch {}
      if (brand && brand._id) {
        const brandNotif = await Notification.create({
          type: "viewInStore",
          description: `User ${
            user ? user.firstName + " " + user.lastName : userName
          } requested a view in store${
            product && product.name ? ` for product '${product.name}'` : ""
          }.`,
          brandId: brand._id,
          read: false,
        });
        console.log("Brand notification created:", brandNotif);

        // Also notify admin
        const adminNotif = await AdminNotification.create({
          type: "View-in-store Request",
          description: `User ${
            user ? user.firstName + " " + user.lastName : userName
          } requested a view in store${
            product && product.name ? ` for product '${product.name}'` : ""
          } from brand '${brand.brandName}'.`,
          brandId: brand._id,
          read: false,
        });
        console.log("Admin notification created:", adminNotif);

        // Email the user about request submission
        if (user && user.email) {
          const emailResult = await sendEmail({
            to: user.email,
            subject: "Your view in store request is being processed!",
            body: `<p><br>Purchase Code: <b>${code}</b><br>Your request to view in store has been submitted successfully and is now processing. Feel free to visit the store anytime!</p>`,
          });
          console.log("User email sent:", emailResult);
        }
      }
    } catch (notifyBrandError) {
      console.error(
        "Failed to notify brand or admin or send email:",
        notifyBrandError
      );
    }

    res.status(201).json(savedViewInStore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all viewInStore entries
const getAllViewInStore = async (req, res) => {
  try {
    const viewInStoreEntries = await ViewInStore.find()
      .populate("productId")
      .populate("userId")
      .populate("brandId");
    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single viewInStore entry by ID
const getViewInStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const viewInStoreEntry = await ViewInStore.findById(id)
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    if (!viewInStoreEntry) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    res.status(200).json(viewInStoreEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a viewInStore entry by ID
const updateViewInStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, productId, userId, userName, brandId, status } = req.body;

    const updatedViewInStore = await ViewInStore.findByIdAndUpdate(
      id,
      { code, productId, userId, userName, brandId, status },
      { new: true }
    );

    if (!updatedViewInStore) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    let brand = null;
    let user = null;
    if (status === "approved" || status === "rejected") {
      try {
        brand = await Brand.findById(brandId);
        user = await User.findById(userId);
        if (
          brand &&
          brand.brandName &&
          user &&
          user.firstName &&
          user.lastName
        ) {
          const adminNotif = await AdminNotification.create({
            type: "View-in-store Request",
            description: `Brand '${brand.brandName}' has ${status} a view in store request from user ${user.firstName} ${user.lastName}.`,
            brandId: brand._id,
            read: false,
          });
          console.log("Admin notification created:", adminNotif);
        }
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }
    }

    // If status is approved, send email to user
    if (status === "approved") {
      try {
        if (user && user.email) {
          const emailResult = await sendEmail({
            to: user.email,
            subject: "Complete your purchase",
            body: `<p>You have seen the product in store and you will pay it. Here is the step to pay it through <a href='https://thedesigngrit.com/myaccount/trackviewinstore'>TheDesignGrit</a>.</p>`,
          });
          console.log("Approval email sent:", emailResult);
        }
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }
    }

    // If status is rejected, send rejection email to user
    if (status === "rejected") {
      try {
        if (user && user.email && brand && brand.brandName) {
          const emailResult = await sendEmail({
            to: user.email,
            subject: "We value your feedback",
            body: `<p>We've heard that you unfortunately didn't like our <b>${brand.brandName}</b>'s products, so we will be happy if you just keep looking for your requirements through our website.</p>`,
          });
          console.log("Rejection email sent:", emailResult);
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    }

    res.status(200).json(updatedViewInStore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a viewInStore entry by ID
const deleteViewInStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedViewInStore = await ViewInStore.findByIdAndDelete(id);

    if (!deletedViewInStore) {
      return res.status(404).json({ message: "ViewInStore entry not found" });
    }

    res.status(200).json({ message: "ViewInStore entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all viewInStore entries by brandId
const getViewInStoreByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params;
    const viewInStoreEntries = await ViewInStore.find({ brandId })
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all viewInStore entries by userId
const getViewInStoreByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewInStoreEntries = await ViewInStore.find({ userId })
      .populate("productId")
      .populate("userId")
      .populate("brandId");

    res.status(200).json(viewInStoreEntries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createViewInStore,
  getAllViewInStore,
  getViewInStoreById,
  updateViewInStore,
  deleteViewInStore,
  getViewInStoreByBrandId,
  getViewInStoreByUserId,
};
