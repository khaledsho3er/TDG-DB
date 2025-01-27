const mongoose = require("mongoose");

const { Schema } = mongoose;
const VendorSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  tier: { type: String, enum: ["1", "2", "3"], default: "3" },
  role: { type: String, enum: ["Vendor"], default: "Vendor" },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
});
module.exports = mongoose.model("Vendor", VendorSchema);
