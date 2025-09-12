// models/Donation.js
const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true }, // Razorpay/Stripe payment ID
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Donation", DonationSchema);
