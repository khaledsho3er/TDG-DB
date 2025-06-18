const User = require("../models/user"); // For all users (regular and Google)
const Employee = require("../models/employees"); // For Employees (employee table)
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");

// Initialize Google OAuth2 client
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

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

    if (!googleClient) {
      return res.status(500).json({
        message:
          "Google authentication is not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (but not Google user)
      user = await User.findOne({ email });

      if (user) {
        // User exists but not with Google, update their account
        user.googleId = googleId;
        user.googleName = name;
        user.googlePicture = picture;
        user.isGoogleUser = true;
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user with Google data
        const [firstName, ...lastNameParts] = name.split(" ");
        const lastName = lastNameParts.join(" ") || "";

        user = new User({
          firstName,
          lastName,
          email,
          googleId,
          googleName: name,
          googlePicture: picture,
          isGoogleUser: true,
          role: "User",
          lastLogin: new Date(),
        });

        await user.save();
      }
    } else {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    }

    // Set session data
    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      shipmentAddress: user.shipmentAddress
        ? user.shipmentAddress.map((address) => ({
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
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      googlePicture: user.googlePicture,
      isGoogleUser: user.isGoogleUser,
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
