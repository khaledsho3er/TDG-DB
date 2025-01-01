// models/JobForm.js
const mongoose = require("mongoose");

const jobFormSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: false },
    country: { type: String, required: true },
    city: { type: String, required: true },
    linkedInUrl: { type: String, required: false },
    notes: { type: String, required: false },
    resume: { type: String, required: true }, // Store the file path or URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobForm", jobFormSchema);
