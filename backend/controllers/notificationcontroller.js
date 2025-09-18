const Notification = require("../models/notification");
const User = require("../models/user");

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, type } = req.query;
    
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: {
        path: 'emergencyId',
        select: 'emergencyType status location'
      }
    };
    
    // Using mongoose-paginate-v2 for pagination
    const notifications = await Notification.paginate(query, options);
    
    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications
    });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve notifications",
      error: error.message
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        status: "read",
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.updateMany(
      { userId, status: { $ne: "read" } },
      { 
        status: "read",
        readAt: new Date()
      }
    );
    
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { count: result.modifiedCount }
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationPreferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: user.notificationPreferences
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
      error: error.message
    });
  }
};

// Add device token for push notifications
const addDeviceToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Device token is required"
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Add token if not already exists
    if (!user.deviceTokens.includes(token)) {
      user.deviceTokens.push(token);
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: "Device token added successfully"
    });
  } catch (error) {
    console.error("Error adding device token:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add device token",
      error: error.message
    });
  }
};

// Remove device token
const removeDeviceToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Device token is required"
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Remove token if exists
    user.deviceTokens = user.deviceTokens.filter(t => t !== token);
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Device token removed successfully"
    });
  } catch (error) {
    console.error("Error removing device token:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove device token",
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotificationPreferences,
  addDeviceToken,
  removeDeviceToken
};