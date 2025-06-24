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
const forgetPassword = require("./routes/forgetPasswordRoutes");
const tagRoutes = require("./routes/tagRoutes");
const productTagRoutes = require("./routes/productTagRoutes");
const relatedProductsRoutes = require("./routes/relatedProductsRoutes");
const cardsRoutes = require("./routes/cardsRoutes");
const Newsletter = require("./routes/newsletterRoutes");
const analyticsRoutes = require("./routes/productsRoutes");
const salesAnalytics = require("./routes/salesRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const conceptRoutes = require("./routes/conceptRoutes");
const promotionsRoutes = require("./routes/promotionRoutes"); // Import the promotions routes
const adminRoutes = require("./routes/adminRoutes");
const adminNotificationRoutes = require("./routes/adminNotificationRoutes"); // Import the admin notifications routes
const productVariantRoutes = require("./routes/productvariantRoutes"); // Import the product variant routes
const paymobRoutes = require("./routes/paymobRoutes"); // Import Paymob routes
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const abandonedCartRoutes = require("./routes/abandonedCartEmail");
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS globally for all routes
app.use(
  cors({
    origin: "https://thedesigngrit.com", // Change this to your frontend's URL
    credentials: true, // Allow cookies to be sent along with requests

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // السماح بكل الطلبات
  })
);
// Middleware to parse JSON bodies
app.use(bodyParser.json({ limit: "500mb" }));

app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" })); // Support URL-encoded data

// MongoDB connection URI
const mongoURI = process.env.Mongo_server;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Now Connected to MongoDB - TDG-DB");
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
      secure: false, // Use true only if HTTPS is enabled
      sameSite: "None",
    },
  })
);
// Serve static files for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Start the cron job
const cron = require("node-cron");
const expirePromotions = require("./cronJobs/promotionCleanup");

cron.schedule("*/1 * * * *", () => {
  console.log("⏰ Running cron job every minute for testing");
  expirePromotions();
});
app.get("/test-expire", async (req, res) => {
  const expirePromotions = require("./cronJobs/promotionCleanup");
  await expirePromotions();
  res.send("Promotion expiration test completed.");
});

// Use the user routes for API endpoints
app.use("/api", userRoutes);
app.use("/api/categories", categoryRoutes); // Category routes
app.use("/api/subcategories", subCategoryRoutes); // SubCategory routes
app.use("/api/types", typeRoutes); // Type routes
app.use("/api/products", products);
app.use("/api/brand", brandRoutes);
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
app.use("/api/forget-password", forgetPassword);
app.use("/api/tags", tagRoutes);
app.use("/api/product-tags", productTagRoutes);
app.use("/api/related-products", relatedProductsRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/newsletter", Newsletter);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sales", salesAnalytics);
app.use("/api/catalogs", catalogRoutes);
app.use("/api/promotions", promotionsRoutes); // Use the promotions routes
app.use("/api/concepts", conceptRoutes); // Use the concept routes
app.use("/api/admin", adminRoutes); // All admin routes prefixed with /adminpanel
app.use("/api/admin-notifications", adminNotificationRoutes); // Admin notifications routes
app.use("/api/product-variants", productVariantRoutes); // Product variant routes
app.use("/api/paymob", paymobRoutes); // Use Paymob routes
app.use("/api/google-auth", googleAuthRoutes);
app.use("/api/mailchimp", abandonedCartRoutes); // Analytics routes
// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
