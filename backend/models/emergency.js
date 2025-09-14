const mongoose = require("mongoose");
const { Schema } = mongoose;

const emergencySchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyType: {
      type: String,
      required: true,
      enum: ["fire", "medical", "security", "natural_disaster", "other"],
    },
    emergencySubtype: String,
    description: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
    },

    // AI classification (optional)
    aiClassification: {
      category: { type: String }, // optional
      severity: { type: Number, min: 1, max: 5 }, // optional
      requiredSkills: [{ type: String }], // optional array of skills
      confidence: { type: Number, min: 0, max: 1, default: null }, // optional, defaults to null
    },

    status: {
      type: String,
      enum: ["active", "responding", "resolved", "cancelled"],
      default: "active",
    },

    responders: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["notified", "en_route", "on_scene", "completed"],
          default: "notified",
        },
        notifiedAt: Date,
        respondedAt: Date,
        arrivedAt: Date,
        completedAt: Date,
        feedback: {
          rating: { type: Number, min: 1, max: 5 },
          comment: String,
        },
      },
    ],

    resolvedAt: Date,
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Create a 2dsphere index for geospatial queries
emergencySchema.index({ "location.coordinates": "2dsphere" });

const Emergency = mongoose.model("Emergency", emergencySchema);

module.exports = Emergency;
