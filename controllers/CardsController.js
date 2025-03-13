const Card = require("../models/Cards");
const User = require("../models/user");
const CryptoJS = require("crypto-js");

// Secret key for encryption (Store this securely in environment variables)
const SECRET_KEY = process.env.CARD_SECRET || "your-secret-key";

// Encrypt function
const encryptCardNumber = (cardNumber) => {
  return CryptoJS.AES.encrypt(cardNumber, SECRET_KEY).toString();
};

// Decrypt function
const decryptCardNumber = (encryptedCard) => {
  const bytes = CryptoJS.AES.decrypt(encryptedCard, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Detect card type based on number
const detectCardType = (cardNumber) => {
  const firstDigit = cardNumber.charAt(0);
  if (/^4/.test(firstDigit)) return "Visa";
  if (/^5[1-5]/.test(cardNumber)) return "MasterCard";
  if (/^3[47]/.test(cardNumber)) return "Amex";
  if (/^6/.test(firstDigit)) return "Discover";
  return "Unknown";
};

// Add a new card (without storing CVV)
exports.addCard = async (req, res) => {
  try {
    const { userId, cardNumber, expiryDate, defaultCard } = req.body;

    if (!userId || !cardNumber || !expiryDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const encryptedCard = encryptCardNumber(cardNumber);
    const cardType = detectCardType(cardNumber);

    // If the card is set as default, update all other cards to not be default
    if (defaultCard) {
      await Card.updateMany({ userId }, { $set: { default: false } });
    }

    const newCard = new Card({
      userId,
      cardNumber: encryptedCard, // Store encrypted
      cardType,
      expiryDate,
      default: defaultCard || false,
    });

    await newCard.save();

    res.status(201).json({ message: "Card added successfully", card: newCard });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all user cards
exports.getUserCards = async (req, res) => {
  try {
    const { userId } = req.params;
    const cards = await Card.find({ userId });

    // Decrypt card numbers before sending response
    const decryptedCards = cards.map((card) => ({
      ...card._doc,
      cardNumber: `**** **** **** ${decryptCardNumber(card.cardNumber).slice(
        -4
      )}`, // Masking for security
    }));

    res.status(200).json(decryptedCards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set a card as default
exports.setDefaultCard = async (req, res) => {
  try {
    const { userId, cardId } = req.body;

    await Card.updateMany({ userId }, { $set: { default: false } });
    await Card.findByIdAndUpdate(cardId, { default: true });

    res.status(200).json({ message: "Default card updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a card
exports.deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    await Card.findByIdAndDelete(cardId);
    res.status(200).json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
