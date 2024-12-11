const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const billingInfoRoutes = require("./routes/billingRoutes"); // Import the billing info routes

const cors = require("cors");
const session = require("express-session"); // Import session middleware

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS globally for all routes
app.use(
  cors({
    origin: "http://localhost:3000", // Change this to your frontend's URL
    credentials: true, // Allow cookies to be sent along with requests
  })
);
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MongoDB connection URI
const mongoURI = process.env.Mongo_server;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB - TDG-DB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the application if the database connection fails
  });

// Set up session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET, // Use a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Use true only if HTTPS is enabled
      sameSite: "lax",
    },
  })
);

// Use the user routes for API endpoints
app.use("/api", userRoutes);
app.use("/api/billing", billingInfoRoutes); // Billing info routes

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
