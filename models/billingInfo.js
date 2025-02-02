const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const billingInfoSchema = new Schema({
  cardNumber: { type: String, required: false },
  cardNameHolder: { type: String, required: true },
  expirationDate: { type: String, required: true },
  cvv: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

// Hash the CVV before saving it to the database
billingInfoSchema.pre("save", async function (next) {
  if (this.isModified("cvv")) {
    try {
      this.cvv = await bcrypt.hash(this.cvv, 10);
    } catch (err) {
      next(err);
    }
  }
  next();
});

const BillingInfo = mongoose.model("BillingInfo", billingInfoSchema);

module.exports = BillingInfo;
