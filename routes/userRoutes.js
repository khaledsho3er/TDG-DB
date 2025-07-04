const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middlewares/authMiddleware");
const transporter = require("../utils/emailTransporter");
const mailchimpService = require("../utils/mailchimp");
const { OAuth2Client } = require("google-auth-library");
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const router = express.Router();
// Sign Up Route
router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    address1,
    address2,
    dateOfBirth,
    gender,
    language,
    region,
    shipmentAddress,
    city,
    country,
    postalCode,
    googleCredential,
  } = req.body;

  try {
    if (googleCredential) {
      if (!googleClient) {
        return res.status(500).json({
          message:
            "Google authentication is not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
        });
      }
      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: googleCredential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;
      // Check if user already exists with this email
      let userByEmail = await User.findOne({ email });
      if (userByEmail) {
        return res
          .status(400)
          .json({ message: "Account already exists with this email." });
      }
      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId });
      if (!user) {
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
          gender: "Other",
          authorityTier: 0,
          permissions: [],
          lastLogin: new Date(),
        });
        await user.save();
      } else {
        // Update last login time
        user.lastLogin = new Date();
        await user.save();
      }
      req.session.userId = user._id;
      req.session.user = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        shipmentAddress: user.shipmentAddress || [],
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        googlePicture: user.googlePicture,
        isGoogleUser: user.isGoogleUser,
      };
      return res.status(201).json({
        message: "Google signup successful",
        user: req.session.user,
      });
    }
    // Normal signup
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Required fields are missing!" });
    }
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Account already exists with this email." });
    }
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      address1,
      address2,
      dateOfBirth,
      gender: gender || "Other",
      language,
      region,
      shipmentAddress,
      role: "User",
      city,
      country,
      authorityTier: 0,
      permissions: [],
      postalCode,
    });
    const savedUser = await newUser.save();
    // --- Mailchimp Integration ---
    try {
      await mailchimpService.addContactToAudience(email, firstName, lastName);
      console.log(`User ${email} added to Mailchimp.`);
    } catch (mailchimpError) {
      console.error("Error adding user to Mailchimp:", mailchimpError);
    }
    // --- End Mailchimp Integration ---
    req.session.userId = savedUser._id;
    req.session.user = {
      id: savedUser._id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      phoneNumber: savedUser.phoneNumber,
      shipmentAddress: savedUser.shipmentAddress || [],
      dateOfBirth: savedUser.dateOfBirth,
      role: savedUser.role,
    };
    res.status(201).json({
      message: "User created successfully",
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  const { email, password, googleCredential } = req.body;
  try {
    if (googleCredential) {
      if (!googleClient) {
        return res.status(500).json({
          message:
            "Google authentication is not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
        });
      }
      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: googleCredential,
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
          // Update existing user with Google data
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
            gender: "Other",
            authorityTier: 0,
            permissions: [],
            lastLogin: new Date(),
          });
          await user.save();
        }
      } else {
        // Update last login time
        user.lastLogin = new Date();
        await user.save();
      }
      req.session.userId = user._id;
      req.session.user = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        shipmentAddress: user.shipmentAddress || [],
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        googlePicture: user.googlePicture,
        isGoogleUser: user.isGoogleUser,
      };
      return res.status(200).json({
        message: "Google authentication successful",
        user: req.session.user,
      });
    }
    // Normal signin
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id; // Save user ID in session
      req.session.user = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        shipmentAddress: user.shipmentAddress || [],
        dateOfBirth: user.dateOfBirth,
        role: user.role,
      };
      res.json({
        message: "User logged in successfully",
        user: req.session.user,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add a route to check session
router.get("/check-session", (req, res) => {
  if (req.session.userId) {
    res.json({
      isAuthenticated: true,
      userId: req.session.userId,
    });
  } else {
    res.status(401).json({
      isAuthenticated: false,
    });
  }
});

// Route to test if user is logged in
router.get("/test", isAuthenticated, (req, res) => {
  res.status(200).json({ message: "You are logged in!" });
});

router.get("/getUser", async (req, res) => {
  console.log("Session on getUser:", req.session); // Debugging

  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Fetched user:", user); // Log user object
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get User by ID Route
router.get("/getUserById/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/updateUser", isAuthenticated, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId, // Use the userId from the session
      req.body,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});
//update user data with ID parmas not sessions
router.put("/updateUser/:id", async (req, res) => {
  const userId = req.params.id;
  const { addresses } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId, // Use the userId from the session
      req.body,
      { addresses },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfullyss",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/changePassword/:id", async (req, res) => {
  const userId = req.params.id;
  const { currentPassword, newPassword } = req.body;

  // // Check if the new password and confirm password match
  // if (newPassword !== confirmPassword) {
  //   return res
  //     .status(400)
  //     .json({ message: "New password and confirm password do not match" });
  // }

  // Validate password strength (optional)
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password should be at least 8 characters long" });
  }

  try {
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the current password matches the stored password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;

    // Save the updated user
    await user.save();
    await transporter.sendMail({
      from: "karimwahba53@gmail.com",
      to: user.email,
      subject: "Password has been reset successfully.",
      text: `Your password has been reset successfully. Welcome Back to The Design Grit!`,
    });
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/signin-vendor", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found!" });

    // Check if the user is a vendor
    if (user.role !== "Vendor") {
      return res.status(403).json({ message: "Access denied! Not a vendor." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      "your_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { httpOnly: true });
    res.status(200).json({ message: "Login successful!", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});

router.get(
  "/admin-dashboard",
  isAuthenticated,
  isAuthorized(["Admin"]),
  (req, res) => {
    res.json({ message: "Welcome Admin!" });
  }
);
router.get(
  "/vendor-dashboard",
  isAuthenticated,
  isAuthorized(["Vendor"]),
  (req, res) => {
    res.json({ message: "Welcome Vendor!" });
  }
);
// Remove a specific shipping address
router.delete("/removeAddress/:userId/:addressId", async (req, res) => {
  const { userId, addressId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address to be removed
    const addressIndex = user.shipmentAddress.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Remove the address
    user.shipmentAddress.splice(addressIndex, 1);

    // If the deleted address was the default, set another one as default
    if (
      user.shipmentAddress.length > 0 &&
      user.shipmentAddress[addressIndex]?.isDefault
    ) {
      user.shipmentAddress[0].isDefault = true; // Set first address as default
    }

    await user.save();
    res.status(200).json({
      message: "Address removed successfully",
      shipmentAddress: user.shipmentAddress,
    });
  } catch (error) {
    console.error("Error removing address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
