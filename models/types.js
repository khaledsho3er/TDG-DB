const mongoose = require("mongoose");

const typeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
});

const Type = mongoose.model("types", typeSchema);
module.exports = Type;
