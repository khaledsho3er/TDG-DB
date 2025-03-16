const Newsletter = require("../models/Newsletter");

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
    res.status(201).json({ message: "Subscribed successfully", subscriber });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Unsubscribe from Newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.params;
    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber)
      return res.status(404).json({ message: "Email not found" });

    subscriber.subscribed = false;
    await subscriber.save();
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
    res.status(200).json({ message: "Subscriber deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
