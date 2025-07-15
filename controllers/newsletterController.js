const Newsletter = require("../models/Newsletter");
const transporter = require("../utils/emailTransporter");
const AdminNotification = require("../models/adminNotifications"); // Import AdminNotification model
const fs = require("fs");
const path = require("path");
// Subscribe to Newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    let existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "Email already subscribed" });
    }

    const subscriber = new Newsletter({ email });
    await subscriber.save();
    // Read and modify email template
    const templatePath = path.join(
      __dirname,
      "../templates/newsletterTemplate.html"
    );
    let emailTemplate = fs.readFileSync(templatePath, "utf8");
    emailTemplate = emailTemplate.replace("{{email}}", email);

    // Email options
    const mailOptions = {
      from: "karimwahba53@gmail.com",
      to: email,
      subject: "Welcome to Our Newsletter!",
      html: emailTemplate, // Use HTML template instead of plain text
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({
          message: "Subscription successful, but email failed to send",
        });
      }
      console.log("Email sent: " + info.response);
      // Create admin notification for new subscription
      const adminNotification = new AdminNotification({
        type: "newsletter",
        description: `New subscription from ${email}`,
        read: false,
      });
      adminNotification.save();
      return res
        .status(201)
        .json({ message: "Subscribed successfully", subscriber });
    });
    res.status(201).json({ message: "Subscribed successfully", subscriber });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Unsubscribe from Newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriber = await Newsletter.findById(id);

    if (!subscriber)
      return res.status(404).json({ message: "Subscriber not found" });

    subscriber.subscribed = false;
    await subscriber.save();
    // Create admin notification for unsubscription
    const adminNotification = new AdminNotification({
      type: "newsletter",
      description: `Unsubscription from ${subscriber.email}`,
      read: false,
    });
    await adminNotification.save();
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all Subscribers (Admin Only)
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find();
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Delete Subscriber (Admin Only)
exports.deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    await Newsletter.findByIdAndDelete(id);
    // Create admin notification for deletion
    const adminNotification = new AdminNotification({
      type: "newsletter",
      description: `Subscriber with ID ${id} deleted`,
      read: false,
    });
    await adminNotification.save();
    res.status(200).json({ message: "Subscriber deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
