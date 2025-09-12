// models/CrisisRequest.js
const mongoose = require("mongoose");

const CrisisRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },

  resourcesNeeded: [String], // e.g., ["water", "food"]

  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending"
  },

  verifiedByAdmin: { 
    type: Boolean, 
    default: false // false = unverified, true = verified
  },

  createdAt: { type: Date, default: Date.now }
});

// 2dsphere index for geo queries
CrisisRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("CrisisRequest", CrisisRequestSchema);
