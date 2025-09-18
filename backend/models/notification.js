const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyId: {
      type: Schema.Types.ObjectId,
      ref: "Emergency",
    },
    type: {
      type: String,
      enum: [
        "emergency_created",
        "emergency_alert",
        "response_update",
        "system",
        "feedback_request",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: Date,
    readAt: Date,
    // New fields for better notification management
    isPushSent: {
      type: Boolean,
      default: false,
    },
    pushSentAt: Date,
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    actionUrl: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ emergencyId: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;