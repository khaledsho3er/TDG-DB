const User = require("../models/user"); // For regular users
const GoogleUser = require("../models/googleUser"); // For Google users
const Employee = require("../models/employees"); // For Employees (employee table)
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.signin = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;

    if (role === "Vendor") {
      user = await User.findOne({ email });
    } else if (role === "Employee") {
      user = await Employee.findOne({ email }).select(
        "_id email role tier password"
      );
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password exists before comparing
    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Include tier only for Employees
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        tier: role === "Employee" ? user.tier : undefined, // Only include for Employees
      },
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Google authentication
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if Google user already exists
    let googleUser = await GoogleUser.findOne({ googleId });

    if (!googleUser) {
      // Check if a regular user exists with this email
      const regularUser = await User.findOne({ email });

      if (regularUser) {
        return res.status(400).json({
          message:
            "An account with this email already exists. Please sign in with your password instead.",
        });
      }

      // Create new Google user
      const [firstName, ...lastNameParts] = name.split(" ");
      const lastName = lastNameParts.join(" ") || "";

      googleUser = new GoogleUser({
        googleId,
        email,
        firstName,
        lastName,
        googleName: name,
        googlePicture: picture,
        role: "GoogleUser",
      });

      await googleUser.save();
    } else {
      // Update last login time
      googleUser.lastLogin = new Date();
      await googleUser.save();
    }

    // Set session data
    req.session.userId = googleUser._id;
    req.session.userType = "google"; // Distinguish from regular users
    req.session.user = {
      id: googleUser._id,
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      phoneNumber: googleUser.phoneNumber,
      shipmentAddress: googleUser.shipmentAddress
        ? googleUser.shipmentAddress.map((address) => ({
            id: address._id,
            address1: address.address1,
            address2: address.address2,
            label: address.label,
            floor: address.floor,
            apartment: address.apartment,
            landmark: address.landmark,
            city: address.city,
            postalCode: address.postalCode,
            country: address.country,
            isDefault: address.isDefault,
          }))
        : [],
      dateOfBirth: googleUser.dateOfBirth,
      role: googleUser.role,
      googlePicture: googleUser.googlePicture,
      isGoogleUser: true,
    };

    res.status(200).json({
      message: "Google authentication successful",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};
