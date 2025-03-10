const mongoose = require("mongoose");
const Counter = require("./Counter");
const TagSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: [
      "Color",
      "Style",
      "Material",
      "Finish",
      "Size",
      "Shape",
      "Functionality",
    ],
    required: true,
  },
});

// Middleware to auto-increment the `id` before saving a new tag
TagSchema.pre("save", async function (next) {
  if (!this.id) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "tagId" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.value;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Tag = mongoose.model("Tag", TagSchema);

module.exports = Tag;
