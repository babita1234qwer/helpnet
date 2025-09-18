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
      emergency_alert: {
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

    // Modified currentLocation field - completely optional
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: function() { return !!this.coordinates; } // Only required if coordinates exist
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coords) {
            // Only validate if coordinates are provided
            if (!coords || coords.length === 0) return true;
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && 
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: "Invalid coordinates"
        }
      },
      // Removed lastUpdated from currentLocation subdocument
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

// Pre-save hook to ensure currentLocation is properly set
userSchema.pre('save', function(next) {
  // If coordinates are [0,0] or empty, remove the currentLocation field entirely
  if (this.currentLocation && this.currentLocation.coordinates) {
    const coords = this.currentLocation.coordinates;
    if (coords.length === 2 && coords[0] === 0 && coords[1] === 0) {
      this.currentLocation = undefined;
    }
  }
  next();
});

// Method to check if user wants notifications of a specific type
userSchema.methods.wantsNotification = function(type) {
  const preferenceMap = {
    'emergency_alert': 'emergency_alert',
    'response_update': 'responseUpdates',
    'system': 'systemNotifications'
  };
  
  const preferenceKey = preferenceMap[type];
  const preferenceValue = this.notificationPreferences[preferenceKey];
  
  console.log(`Checking notification preference for user ${this._id}:`);
  console.log(`- Notification type: ${type}`);
  console.log(`- Preference key: ${preferenceKey}`);
  console.log(`- Preference value: ${preferenceValue}`);
  
  if (preferenceKey && preferenceValue !== false) {
    console.log(`- Result: User wants this notification`);
    return true;
  }
  
  console.log(`- Result: User does not want this notification`);
  return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;