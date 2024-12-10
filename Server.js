const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS globally for all routes
app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MongoDB connection URI (you can add "TDG-DB" directly in the URI or use the existing environment variable)
const mongoURI = process.env.Mongo_server;

// Connect to MongoDB and explicitly connect to `TDG-DB`
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

// Use the user routes for API endpoints
app.use("/api", userRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
