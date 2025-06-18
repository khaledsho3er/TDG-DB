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
// exports.googleAuth = async (req, res) => {
//   console.log("=== GOOGLE AUTH FUNCTION CALLED ===");
//   console.log("Request body:", req.body);
//   console.log("Request method:", req.method);
//   console.log("Request URL:", req.url);

//   try {
//     const { credential } = req.body;
//     console.log("Google auth request received");

//     if (!credential) {
//       return res.status(400).json({ message: "Google credential is required" });
//     }

//     if (!googleClient) {
//       return res.status(500).json({
//         message:
//           "Google authentication is not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
//       });
//     }

//     // Verify the Google token
//     const ticket = await googleClient.verifyIdToken({
//       idToken: credential,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const { sub: googleId, email, name, picture } = payload;

//     console.log("Google payload received:", { googleId, email, name, picture });

//     // Check if user already exists with this Google ID
//     let user = await User.findOne({ googleId });
//     console.log("User found by googleId:", user ? "Yes" : "No");

//     if (!user) {
//       // Check if user exists with this email (but not Google user)
//       user = await User.findOne({ email });
//       console.log("User found by email:", user ? "Yes" : "No");

//       if (!user) {
//         // User exists but not with Google, update their account
//         console.log("Updating existing user with Google data");
//         user.googleId = googleId;
//         user.googleName = name;
//         user.googlePicture = picture;
//         user.isGoogleUser = true;
//         user.lastLogin = new Date();
//         await user.save();
//         console.log("Existing user updated successfully");
//       } else {
//         // Create new user with Google data - following signup pattern
//         console.log("Creating new user with Google data");
//         const [firstName, ...lastNameParts] = name.split(" ");
//         const lastName = lastNameParts.join(" ") || "";

//         // Create new user following the signup pattern
//         const newUser = new User({
//           firstName,
//           lastName,
//           email,
//           googleId,
//           googleName: name,
//           googlePicture: picture,
//           isGoogleUser: true,
//           role: "User",
//           gender: "Other",
//           authorityTier: 0,
//           permissions: [],
//           lastLogin: new Date(),
//         });

//         console.log("New user data prepared:", {
//           firstName,
//           lastName,
//           email,
//           googleId,
//           role: "User",
//         });

//         const savedUser = await newUser.save();
//         console.log("New user created successfully with ID:", savedUser._id);

//         // Set the user variable to the saved user
//         user = savedUser;
//       }
//     } else {
//       // Update last login time
//       console.log("Updating last login for existing Google user");
//       user.lastLogin = new Date();
//       await user.save();
//       console.log("Last login updated successfully");
//     }

//     // Set session data
//     req.session.userId = user._id;
//     req.session.user = {
//       id: user._id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       phoneNumber: user.phoneNumber,
//       shipmentAddress: user.shipmentAddress
//         ? user.shipmentAddress.map((address) => ({
//             id: address._id,
//             address1: address.address1,
//             address2: address.address2,
//             label: address.label,
//             floor: address.floor,
//             apartment: address.apartment,
//             landmark: address.landmark,
//             city: address.city,
//             postalCode: address.postalCode,
//             country: address.country,
//             isDefault: address.isDefault,
//           }))
//         : [],
//       dateOfBirth: user.dateOfBirth,
//       role: user.role,
//       googlePicture: user.googlePicture,
//       isGoogleUser: user.isGoogleUser,
//     };

//     console.log("Session set successfully, sending response");
//     res.status(200).json({
//       message: "Google authentication successful",
//       user: req.session.user,
//     });
//   } catch (error) {
//     console.error("Google authentication error:", error);
//     console.error("Error name:", error.name);
//     console.error("Error message:", error.message);
//     console.error("Error stack:", error.stack);

//     // If it's a validation error, log the specific validation issues
//     if (error.name === "ValidationError") {
//       console.error("Validation errors:", error.errors);
//     }

//     res.status(500).json({
//       message: "Google authentication failed",
//       error: error.message,
//       errorType: error.name,
//     });
//   }
// };
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log("📥 Google auth request received");

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!googleClient) {
      return res.status(500).json({
        message:
          "Google authentication is not configured. Please set GOOGLE_CLIENT_ID in environment variables.",
      });
    }

    // ✅ Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email || !name) {
      return res
        .status(400)
        .json({ message: "Missing required Google profile information" });
    }

    console.log("✅ Google payload:", { email, googleId, name });

    // Split name into first and last
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ") || "Unknown";

    // 🔍 Try to find user by googleId first
    let user = await User.findOne({ googleId });

    if (!user) {
      // 🔍 Try to find user by email
      user = await User.findOne({ email });

      if (user) {
        // 🛠️ Update existing user with Google info
        user.googleId = googleId;
        user.googleName = name;
        user.googlePicture = picture;
        user.isGoogleUser = true;
        user.lastLogin = new Date();

        try {
          await user.save();
          console.log("🔄 Existing user updated with Google info");
        } catch (err) {
          console.error("❌ Error updating existing user:", err);
          return res
            .status(500)
            .json({
              message: "Failed to update existing user",
              error: err.message,
            });
        }
      } else {
        // ✳️ Create a new user
        const newUser = new User({
          firstName,
          lastName,
          email,
          googleId,
          googleName: name,
          googlePicture: picture,
          isGoogleUser: true,
          role: "User", // Required by schema
          gender: "Other",
          authorityTier: 0,
          permissions: [],
          lastLogin: new Date(),
        });

        try {
          const savedUser = await newUser.save();
          console.log("✅ New Google user created:", savedUser._id);
          user = savedUser;
        } catch (err) {
          console.error("❌ Error creating new Google user:", err);
          return res
            .status(500)
            .json({ message: "Failed to create new user", error: err.message });
        }
      }
    } else {
      // 🕒 Update last login if user already existed
      user.lastLogin = new Date();
      try {
        await user.save();
        console.log("🕒 Last login updated for existing Google user");
      } catch (err) {
        console.error("❌ Error updating last login:", err);
      }
    }

    // ✅ Set session data
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

    console.log("✅ Session set for user:", user.email);

    res.status(200).json({
      message: "Google authentication successful",
      user: req.session.user,
    });
  } catch (error) {
    console.error("❌ Google authentication error:", error);
    res.status(500).json({
      message: "Google authentication failed",
      error: error.message,
      errorType: error.name,
    });
  }
};
// Test function to verify User model
exports.testUserCreation = async (req, res) => {
  try {
    console.log("Testing User model creation...");

    const testUser = new User({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      role: "User",
      gender: "Other",
      authorityTier: 0,
      permissions: [],
    });

    console.log("Test user object created:", testUser);

    const savedTestUser = await testUser.save();
    console.log("Test user saved successfully:", savedTestUser._id);

    // Clean up - delete the test user
    await User.findByIdAndDelete(savedTestUser._id);
    console.log("Test user deleted");

    res.json({ message: "User model is working correctly" });
  } catch (error) {
    console.error("Test user creation failed:", error);
    res.status(500).json({
      message: "User model test failed",
      error: error.message,
    });
  }
};

// Function to check all users in database
exports.checkAllUsers = async (req, res) => {
  try {
    console.log("Checking all users in database...");

    const allUsers = await User.find({});
    console.log("Total users found:", allUsers.length);

    const userList = allUsers.map((user) => ({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isGoogleUser: user.isGoogleUser,
      googleId: user.googleId,
      createdAt: user.createdAt,
    }));

    res.json({
      message: "Users retrieved successfully",
      totalUsers: allUsers.length,
      users: userList,
    });
  } catch (error) {
    console.error("Error checking users:", error);
    res.status(500).json({
      message: "Failed to check users",
      error: error.message,
    });
  }
};
