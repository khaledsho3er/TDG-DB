const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const typeRoutes = require("./routes/typeRoutes");
const products = require("./routes/productsRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const catalogueRoutes = require("./routes/catalogueRoutes");
const faqRoutes = require("./routes/faqRoutes");
const policyRoutes = require("./routes/policiesRoutes");
const reviews = require("./routes/reviewsRoutes");
const contactUsRoutes = require("./routes/contactUsRoutes");
const jobRoutes = require("./routes/jobRoutes");
const jobFormRoutes = require("./routes/jobFormRoutes");
const cors = require("cors");
const path = require("path"); // For serving static files

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

app.use(bodyParser.urlencoded({ extended: true })); // Support URL-encoded data
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
// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Use the user routes for API endpoints
app.use("/api", userRoutes);
app.use("/api/categories", categoryRoutes); // Category routes
app.use("/api/subcategories", subCategoryRoutes); // SubCategory routes
app.use("/api/types", typeRoutes); // Type routes
app.use("/api/products", products);
app.use("/api/vendors", vendorRoutes);
app.use("/api/catalogues", catalogueRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/reviews", reviews);
app.use("/api/contactus", contactUsRoutes); //contactUs Routes
app.use("/api/jobdesc", jobRoutes);
app.use("/api/jobforms", jobFormRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
