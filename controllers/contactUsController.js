const ContactUs = require("../models/contactUs");
const AdminNotification = require("../models/adminNotifications"); // Import AdminNotification model

// Create a new contact us message
const createMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const userId = req.user ? req.user._id : null; // Optionally, get the userId if the user is signed in

    const newMessage = new ContactUs({
      name,
      email,
      subject,
      message,
      userId,
    });

    await newMessage.save();
    // Create admin notification for the new contact message
    const adminNotification = new AdminNotification({
      type: "contact",
      description: `New contact message from ${name} (${email}): "${subject}"`,
      read: false,
    });
    await adminNotification.save();
    res
      .status(201)
      .json({ message: "Message sent successfully!", data: newMessage });
  } catch (error) {
    res.status(500).json({ error: "Error creating message" });
  }
};

// Get all contact us messages (Admin use only)
const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactUs.find();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
};

// Get a single contact us message by ID
const getMessageById = async (req, res) => {
  try {
    const message = await ContactUs.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: "Error fetching message" });
  }
};

// Update a contact us message by ID (Admin use only)
const updateMessage = async (req, res) => {
  try {
    const message = await ContactUs.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res
      .status(200)
      .json({ message: "Message updated successfully", data: message });
  } catch (error) {
    res.status(500).json({ error: "Error updating message" });
  }
};

// Delete a contact us message by ID (Admin use only)
const deleteMessage = async (req, res) => {
  try {
    const message = await ContactUs.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting message" });
  }
};

module.exports = {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
};
