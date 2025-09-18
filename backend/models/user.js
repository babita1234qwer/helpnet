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
    isAuthenticated: {
      type: Boolean,
      default: false
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // Notification preferences
    notificationPreferences: {
      push: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      emergencyAlerts: {
        type: Boolean,
        default: true,
      },
      responseUpdates: {
        type: Boolean,
        default: true,
      },
      systemNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // Device tokens for push notifications
    deviceTokens: [{
      type: String,
    }],

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
        name: { type: String, required: true },
        issuer: String,
        expiryDate: Date,
      },
    ],

    // Modified currentLocation field - no default coordinates
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        // Removed default: [0, 0]
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    
    availabilityStatus: {
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
    timestamps: true,
  }
);

// Geospatial index for location-based queries
userSchema.index({ "currentLocation": "2dsphere" }, { sparse: true }); // Added sparse option

// Method to check if user wants notifications of a specific type
userSchema.methods.wantsNotification = function(type) {
  if (type === "emergency_alert" && this.notificationPreferences.emergencyAlerts) return true;
  if (type === "response_update" && this.notificationPreferences.responseUpdates) return true;
  if (type === "system" && this.notificationPreferences.systemNotifications) return true;
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;