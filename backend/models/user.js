const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    
      trim: true,
    },
    isAuthenticated:{
      type:Boolean,
      default:false
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    skills: [
      {
        type: String,
        enum: [
          "first_aid",
          "cpr",
          "fire_safety",
          "search_rescue",
          "medical",
          "emergency_response",
          "other",
        ],
      },
    ],

    certifications: [
      {
        name: { type: String, required: true }, // e.g. "CPR Training"
        issuer: String, // who issued it
        expiryDate: Date,
      },
    ],

    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      updatedAt: { type: Date, default: Date.now },
    },

    availability: {
      type: Boolean,
      default: true,
    },

    trustScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    responseHistory: [
      {
        emergencyId: {
          type: Schema.Types.ObjectId,
          ref: "Emergency",
        },
        responseTime: Number, // in seconds
        feedbackRating: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Geospatial index for location-based queries
userSchema.index({ "currentLocation.coordinates": "2dsphere" });

const User = mongoose.model("User", userSchema);

module.exports = User;

