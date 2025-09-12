// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    
  },

  role: {
    type: String,
    enum: ["requester", "helper", "admin"],
    default: "requester"
  },

  phone: {
    type: String,
    match: /^[0-9]{10}$/,
     required: true

  },

  // 🔹 Location field for Live Map & Geo Queries
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },

  // 🔹 Resources the helper can provide
  resources: [String], // e.g., ["food", "water", "medicine"]

  verified: {
    type: Boolean,
    default: false // Admin verification
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 🔹 2dsphere index for geospatial queries (nearest helpers / requests)
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", UserSchema);
