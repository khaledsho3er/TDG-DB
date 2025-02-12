const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const typeRoutes = require("./routes/typeRoutes");
const products = require("./routes/productsRoutes");
const brandRoutes = require("./routes/brandRoutes");
const catalogueRoutes = require("./routes/catalogueRoutes");
const faqRoutes = require("./routes/faqRoutes");
const policyRoutes = require("./routes/policiesRoutes");
const bimcad = require("./routes/bimcadRoutes");
const reviews = require("./routes/reviewsRoutes");
const contactUsRoutes = require("./routes/contactUsRoutes");
const jobRoutes = require("./routes/jobRoutes");
const jobFormRoutes = require("./routes/jobFormRoutes");
const cors = require("cors");
const path = require("path"); // For serving static files
const employeeRoutes = require("./routes/employeeRoutes");
const authSigninEmp = require("./routes/authRoutes");
const session = require("express-session"); // Import session middleware
const orderRoutes = require("./routes/orderRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const favoritesRoute = require("./routes/favoritesRoute");
const quotationRoutes = require("./routes/quotationRoutes");
const viewInStoreRoutes = require("./routes/viewInStoreRoutes");
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS globally for all routes
app.use(
  cors({
    origin: "https://thedesigngrit.com", // Change this to your frontend's URL
    credentials: true, // Allow cookies to be sent along with requests

    methods: ["GET", "POST", "PUT", "DELETE"], // السماح بكل الطلبات
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
      httpOnly: true, // More secure
      secure: true, // Use true only if HTTPS is enabled
      sameSite: "None",
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
app.use("/api/brand", brandRoutes);
app.use("/api/catalogues", catalogueRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/bimcad", bimcad);
app.use("/api/reviews", reviews);
app.use("/api/contactus", contactUsRoutes); //contactUs Routes
app.use("/api/jobdesc", jobRoutes);
app.use("/api/jobforms", jobFormRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/signin-emp", authSigninEmp);
app.use("/api/orders", orderRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/favorites", favoritesRoute);
app.use("/api/quotation", quotationRoutes);
app.use("/api/view-in-store", viewInStoreRoutes);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
