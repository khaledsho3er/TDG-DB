const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middlewares/authMiddleware");

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
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Required fields are missing!" });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
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
      gender: "Other",
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
    res.status(201).json({
      message: "User created successfully",
      user: { id: savedUser._id, email: savedUser.email },
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign In Route
// Sign In Route
// router.post("/signin", async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res
//       .status(400)
//       .json({ message: "Email and password are required." });
//   }

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Store the userId in the session
//     req.session.userId = user._id;
//     console.log("Session ID:", req.session.id); // Log session ID to check
//     console.log("Session User ID after login:", req.session.userId); // Log session user ID to check

//     req.session.save((err) => {
//       if (err) {
//         console.error("Error saving session:", err);
//         return res.status(500).json({ message: "Error saving session" });
//       }
//       res.status(200).json({
//         message: "User logged in successfully",
//         user: { id: user._id, email: user.email },
//       });
//     });
//   } catch (error) {
//     console.error("Error signing in user:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user._id; // Save user ID in session
    console.log("Session data after login:", req.session); // Debugging session data
    req.session.user={
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address1: user.address1,
      address2: user.address2,
      dateOfBirth: user.dateOfBirth
    }
    res.json({ message: "User logged in successfully", user: req.session.user });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});



// router.post("/signin", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     // Verify user credentials
//     const user = await User.findOne({ email });
//     console.log("User:", user);

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // Set session data
//     req.session.userId = user._id;
//     req.session.email = user.email;
//     console.log("session:", req.session.userId);

//     // Send user data without sensitive information
//     res.json({
//       id: user._id,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       phoneNumber: user.phoneNumber,
//       address1: user.address1,
//       address2: user.address2,
//       dateOfBirth: user.dateOfBirth,
//       gender: user.gender,
//       role: user.role,
//       // other non-sensitive user info
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

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
// Protected route to update user information
// router.put("/update", isAuthenticated, async (req, res) => {
//   console.log("Request Body:", req.body); // Log the incoming request body

//   const { firstName, lastName, phoneNumber, address1 } = req.body;

//   if (!req.session.userId) {
//     return res.status(401).json({ message: "User not authenticated" });
//   }

//   const user = await User.findById(req.session.userId);
//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   user.firstName = firstName || user.firstName;
//   user.lastName = lastName || user.lastName;
//   user.phoneNumber = phoneNumber || user.phoneNumber;
//   user.address1 = address1 || user.address1;

//   const updatedUser = await user.save();
//   res.status(200).json({ message: "User updated", user: updatedUser });
// });

// Route to test if user is logged in
router.get("/test", isAuthenticated, (req, res) => {
  res.status(200).json({ message: "You are logged in!" });
});

// Route to fetch user data (Profile)
// function isAuthenticated(req, res, next) {
//   console.log("Session ID in isAuthenticated:", req.session.id); // Log session ID to check
//   if (!req.session.userId) {
//     return res.status(401).json({ message: "User not authenticated" });
//   }
//   next();
// }

// router.get("/profile", isAuthenticated, async (req, res) => {
//   console.log("Session User ID in profile route:", req.session.userId); // Log session user ID

//   try {
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       id: user._id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       address1: user.address1,
//       address2: user.address2,
//     });
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({ message: "Internal server error" });
// //   }
// // });
// router.get("/profile", isAuthenticated, async (req, res) => {
//   try {
//     console.log("Session User ID in profile route:", req.session.userId); // Log session user ID
//     // Fetch user data from the database using the userId stored in the session
//     const user = await User.findById(req.session.userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Send back the user data
//     res.status(200).json({
//       id: user._id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       address1: user.address1,
//       address2: user.address2,
//       dateOfBirth: user.dateOfBirth,
//       gender: user.gender,
//       language: user.language,
//       region: user.region,
//       shipmentAddress: user.shipmentAddress,
//     });
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

///old user router get function
// router.get("/getUser", async (req, res) => {
//   console.log("Session on getUser:", req.session); // Debugging
//   if (!req.session.userId) {
//     return res.status(401).json({ message: "Not authenticated" });
//   }

//   try {
//     const user = await User.findById(req.session.userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log("Fetched user:", user); // Log user object
//     res.json({
//       firstName: user.firstName, // Explicitly send the firstName field
//       lastName: user.lastName,
//       email: user.email,
//     });
//   } catch (err) {
//     console.error("Error fetching user:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });
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
router.put("/changePassword", isAuthenticated, async (req, res) => {
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
    // Find the user by their ID stored in the session
    const user = await User.findById(req.session.userId);
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
    console.log("Payload:", { currentPassword, newPassword });
    console.log("Request body received by backend:", req.body);
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

module.exports = router;
