const mongoose = require('mongoose');
const Emergency = require("../models/emergency");
const User = require("../models/user");
const Notification = require("../models/notification");
const axios = require("axios");
let io = null;
try {
  io = require('../socket').io;
} catch (e) {
  // fallback: try to get from global if set
  io = global.io || null;
}

function successResponse(res, data, message = "Success", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message = "Error", status = 500, error = null) {
  return res.status(status).json({
    success: false,
    message,
    error: error?.message || null,
  });
}

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToEmergency = (emergencyId, event, data) => {
  if (io) {
    io.to(`emergency:${emergencyId}`).emit(event, data);
  }
};

const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const EVENTS = {
  NEW_EMERGENCY: "newEmergency",
  EMERGENCY_CREATED: "emergencyCreated",
  RESPONDER_ADDED: "responderAdded",
  RESPONDER_UPDATED: "responderUpdated",
  EMERGENCY_STATUS_UPDATED: "emergencyStatusUpdated",
  EMERGENCY_RESOLVED: "emergencyResolved",
  NOTIFICATION_RECEIVED: "notificationReceived",
};

// Reverse geocoding with Nominatim (OpenStreetMap)
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'EmergencyApp/1.0 (contact@emergencyapp.com)'
        }
      }
    );
    
    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
  } catch (error) {
    console.error("Error in Nominatim Reverse Geocoding:", error.message);
  }
  return "Unknown location";
};

// Get directions with OSRM (Open Source Routing Machine)
const getDirections = async (startLng, startLat, endLng, endLat) => {
  try {
    const response = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`
    );
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      return response.data.routes[0].duration; // duration in seconds
    }
  } catch (error) {
    console.error("Error in OSRM Directions:", error.message);
  }
  return null;
};

// Helper function to create and send notificationsc

const createNotification = async (userId, notificationData) => {
  try {
    console.log(`Creating notification for user ${userId} of type: ${notificationData.type}`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User ${userId} not found in database`);
      return null;
    }
    
    console.log(`User found: ${user.name || user._id}`);
    
    // Check if user wants this type of notification
    const wantsNotification = user.wantsNotification(notificationData.type);
    console.log(`User wants ${notificationData.type} notification: ${wantsNotification}`);
    
    if (!wantsNotification) {
      console.log(`User ${userId} has disabled ${notificationData.type} notifications`);
      return null;
    }
    
    const notification = new Notification({
      userId,
      ...notificationData,
    });
    
    const savedNotification = await notification.save();
    console.log(`Notification saved with ID: ${savedNotification._id}`);
    
    // Send real-time notification via socket
    emitToUser(userId, EVENTS.NOTIFICATION_RECEIVED, {
      notification: {
        _id: savedNotification._id,
        type: savedNotification.type,
        title: savedNotification.title,
        message: savedNotification.message,
        priority: savedNotification.priority,
        createdAt: savedNotification.createdAt,
      }
    });
    
    console.log(`Socket event emitted to user ${userId}`);
    return savedNotification;
  } catch (error) {
    console.error(`Error creating notification for user ${userId}:`, error);
    return null;
  }
};
const createEmergency = async (req, res) => {
  try {
    const { emergencyType, description, longitude, latitude } = req.body;
    const userId = req.user._id;

    if (!emergencyType || !description || !longitude || !latitude) {
      return errorResponse(res, "Missing required fields", 400);
    }

    // Validate coordinates
    if (isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude))) {
      return errorResponse(res, "Invalid coordinates", 400);
    }

    // Get address using Nominatim
    const address = await reverseGeocode(latitude, longitude);

    const emergency = new Emergency({
      createdBy: userId,
      emergencyType,
      description,
      location: {
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
      status: "active",
    });

    await emergency.save();

    // Debug: Check total users with location
    const totalUsersWithLocation = await User.countDocuments({
      $and: [
        { currentLocation: { $exists: true } },
        { currentLocation: { $ne: null } }
      ]
    });
    console.log(`Total users with location: ${totalUsersWithLocation}`);

    // Debug: Check total available users
    const totalAvailableUsers = await User.countDocuments({
      availabilityStatus: true
    });
    console.log(`Total available users: ${totalAvailableUsers}`);

    // Debug: Check users with location within 50km (for testing)
    const usersWithin50km = await User.countDocuments({
      $and: [
        { currentLocation: { $exists: true } },
        { currentLocation: { $ne: null } },
        { 
          currentLocation: {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(longitude), parseFloat(latitude)],
                50000 / 6378137 // 50km in radians
              ]
            }
          }
        }
      ]
    });
    console.log(`Users within 50km: ${usersWithin50km}`);

    // Find nearby users with multiple fallback strategies
    let nearbyUsers = [];
    
    // Strategy 1: Strict query (all conditions)
    nearbyUsers = await User.find({
      availabilityStatus: true,
      $and: [
        { currentLocation: { $exists: true } },
        { currentLocation: { $ne: null } },
        { 
          currentLocation: {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(longitude), parseFloat(latitude)],
                5000 / 6378137 // 5km in radians
              ]
            }
          }
        }
      ]
    });
    console.log(`Strategy 1 (5km, available): Found ${nearbyUsers.length} nearby users`);

    // Strategy 2: If no users found, expand radius to 20km
    if (nearbyUsers.length === 0) {
      nearbyUsers = await User.find({
        availabilityStatus: true,
        $and: [
          { currentLocation: { $exists: true } },
          { currentLocation: { $ne: null } },
          { 
            currentLocation: {
              $geoWithin: {
                $centerSphere: [
                  [parseFloat(longitude), parseFloat(latitude)],
                  20000 / 6378137 // 20km in radians
                ]
              }
            }
          }
        ]
      });
      console.log(`Strategy 2 (20km, available): Found ${nearbyUsers.length} nearby users`);
    }

    // Strategy 3: If still no users, include unavailable users
    if (nearbyUsers.length === 0) {
      nearbyUsers = await User.find({
        $and: [
          { currentLocation: { $exists: true } },
          { currentLocation: { $ne: null } },
          { 
            currentLocation: {
              $geoWithin: {
                $centerSphere: [
                  [parseFloat(longitude), parseFloat(latitude)],
                  20000 / 6378137 // 20km in radians
                ]
              }
            }
          }
        ]
      });
      console.log(`Strategy 3 (20km, all users): Found ${nearbyUsers.length} nearby users`);
    }

    // Strategy 4: If still no users, expand radius to 50km
    if (nearbyUsers.length === 0) {
      nearbyUsers = await User.find({
        $and: [
          { currentLocation: { $exists: true } },
          { currentLocation: { $ne: null } },
          { 
            currentLocation: {
              $geoWithin: {
                $centerSphere: [
                  [parseFloat(longitude), parseFloat(latitude)],
                  50000 / 6378137 // 50km in radians
                ]
              }
            }
          }
        ]
      });
      console.log(`Strategy 4 (50km, all users): Found ${nearbyUsers.length} nearby users`);
    }

    // Create notifications for nearby users
    if (nearbyUsers.length > 0) {
      console.log(`Creating notifications for ${nearbyUsers.length} nearby users`);
      for (const user of nearbyUsers) {
        await createNotification(user._id, {
          emergencyId: emergency._id,
          type: "emergency_alert",
          title: `${emergencyType.toUpperCase()} EMERGENCY NEARBY`,
          message: `Someone needs help with a ${emergencyType} emergency near ${address}. Can you respond?`,
          priority: "high",
          actionRequired: true,
          actionUrl: `/emergency/${emergency._id}`,
        });
      }
    } else {
      console.log("No nearby users found to notify");
    }

    // Create notification for emergency creator
    await createNotification(userId, {
      emergencyId: emergency._id,
      type: "emergency_created",
      title: "Your emergency was created",
      message: `Your ${emergencyType} emergency has been logged. Nearby responders are being alerted.`,
      priority: "medium",
    });

    // Emit socket events to nearby users
    nearbyUsers.forEach((user) => {
      emitToUser(user._id, EVENTS.NEW_EMERGENCY, {
        emergency: {
          _id: emergency._id,
          emergencyType: emergency.emergencyType,
          description: emergency.description,
          location: emergency.location,
          createdAt: emergency.createdAt,
        },
      });
    });

    // Broadcast to everyone
    emitToAll(EVENTS.EMERGENCY_CREATED, {
      emergencyId: emergency._id,
      emergencyType: emergency.emergencyType,
      createdBy: emergency.createdBy,
      location: emergency.location,
    });

    return successResponse(
      res,
      { emergency, notifiedUsers: nearbyUsers.length },
      "Emergency created and nearby users notified",
      201
    );
  } catch (error) {
    console.error("Error creating emergency:", error);
    return errorResponse(res, "Failed to create emergency", 500, error);
  }
};

const getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return successResponse(res, emergencies, "Active emergencies retrieved");
  } catch (error) {
    console.error("Error retrieving active emergencies:", error);
    return errorResponse(res, "Failed to retrieve emergencies", 500, error);
  }
};

const getNearbyEmergencies = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    if (!longitude || !latitude) {
      return errorResponse(res, "Longitude and latitude are required", 400);
    }

    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return successResponse(res, emergencies, "Nearby emergencies retrieved");
  } catch (error) {
    console.error("Error retrieving nearby emergencies:", error);
    return errorResponse(res, "Failed to retrieve emergencies", 500, error);
  }
};

const getEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId)
      .populate("createdBy", "name")
      .populate("responders.userId", "name phone currentLocation");

    if (!emergency) return errorResponse(res, "Emergency not found", 404);

    return successResponse(res, emergency, "Emergency details retrieved");
  } catch (error) {
    console.error("Error retrieving emergency details:", error);
    return errorResponse(res, "Failed to retrieve emergency details", 500, error);
  }
};

const respondToEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) return errorResponse(res, "Emergency not found", 404);

    if (["resolved", "cancelled"].includes(emergency.status)) {
      return errorResponse(res, "Emergency already resolved/cancelled", 400);
    }

    // Responder logic
    let responder = emergency.responders.find(
      (r) => r.userId.toString() === userId
    );

    if (responder) {
      if (responder.status === "notified") {
        responder.status = "en_route";
        responder.respondedAt = Date.now();
      } else if (responder.status === "en_route") {
        responder.status = "on_scene";
        responder.arrivedAt = Date.now();
      } else if (responder.status === "on_scene") {
        responder.status = "completed";
        responder.completedAt = Date.now();
      }
    } else {
      emergency.responders.push({
        userId,
        status: "en_route",
        notifiedAt: Date.now(),
        respondedAt: Date.now(),
      });
    }

    if (emergency.status === "active" && emergency.responders.length > 0) {
      emergency.status = "responding";
    }

    // ETA calculation using OSRM
    try {
      const user = await User.findById(userId).select("currentLocation");
      if (user?.currentLocation?.coordinates) {
        const [startLng, startLat] = user.currentLocation.coordinates;
        const [endLng, endLat] = emergency.location.coordinates;

        const duration = await getDirections(startLng, startLat, endLng, endLat);
        
        if (duration) {
          const idx = emergency.responders.findIndex(
            (r) => r.userId.toString() === userId
          );
          if (idx !== -1) {
            emergency.responders[idx].eta = {
              seconds: duration,
              timestamp: new Date(Date.now() + duration * 1000),
            };
          }
        }
      }
    } catch (err) {
      console.error("ETA calculation failed:", err.message);
    }

    await emergency.save();

    // Notify creator
    await createNotification(emergency.createdBy, {
      emergencyId: emergency._id,
      type: "response_update",
      title: "Responder on the way",
      message: "A responder is on the way to help you.",
      priority: "high",
    });

    // Emit sockets
    emitToUser(emergency.createdBy, EVENTS.RESPONDER_ADDED, {
      emergencyId: emergency._id,
      responder: {
        _id: userId,
        status: responder ? responder.status : "en_route",
      },
    });

    emitToEmergency(emergencyId, EVENTS.RESPONDER_UPDATED, {
      emergencyId: emergency._id,
      responder: {
        _id: userId,
        status: responder ? responder.status : "en_route",
      },
    });

    return successResponse(res, { emergency }, "Response recorded successfully");
  } catch (error) {
    console.error("Error responding to emergency:", error);
    return errorResponse(res, "Failed to respond to emergency", 500, error);
  }
};

const updateEmergencyStatus = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return errorResponse(res, "Invalid emergency ID", 400);
    }

    if (
      !status ||
      !["active", "responding", "resolved", "cancelled"].includes(status)
    ) {
      return errorResponse(res, "Invalid status", 400);
    }

    // Find the emergency
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return errorResponse(res, "Emergency not found", 404);
    }

    // Only allow the creator or an active responder to update status
    const isCreator = emergency.createdBy.toString() === userId;
    const isResponder = emergency.responders.some(
      (responder) =>
        responder.userId.toString() === userId &&
        ["en_route", "on_scene"].includes(responder.status)
    );

    if (!isCreator && !isResponder) {
      return errorResponse(res, "Not authorized to update this emergency", 403);
    }

    // Update status
    emergency.status = status;

    // If resolved, set resolvedAt
    if (status === "resolved") {
      emergency.resolvedAt = Date.now();
    }

    await emergency.save();

    // Notify all responders and creator
    const notificationUsers = [emergency.createdBy, ...emergency.responders.map(r => r.userId)];
    
    for (const userId of notificationUsers) {
      await createNotification(userId, {
        emergencyId: emergency._id,
        type: "response_update",
        title: `Emergency status updated`,
        message: `Emergency status has been updated to: ${status}`,
        priority: status === "resolved" ? "high" : "medium",
      });
    }

    // Emit socket event to all responders and the creator
    emitToEmergency(
      emergencyId,
      EVENTS.EMERGENCY_STATUS_UPDATED,
      {
        emergencyId: emergency._id,
        status: emergency.status,
        updatedBy: userId,
      }
    );

    // If resolved, also broadcast to all
    if (status === "resolved") {
      emitToAll(EVENTS.EMERGENCY_RESOLVED, {
        emergencyId: emergency._id,
      });
    }

    return successResponse(
      res,
      { emergency },
      "Emergency status updated successfully"
    );
  } catch (error) {
    console.error("Error updating emergency status:", error);
    return errorResponse(res, "Failed to update emergency status", 500, error);
  }
};

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
    
    return successResponse(res, notifications, "Notifications retrieved successfully");
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return errorResponse(res, "Failed to retrieve notifications", 500, error);
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
      return errorResponse(res, "Notification not found", 404);
    }
    
    return successResponse(res, notification, "Notification marked as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return errorResponse(res, "Failed to mark notification as read", 500, error);
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
    
    return successResponse(res, { count: result.modifiedCount }, "All notifications marked as read");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return errorResponse(res, "Failed to mark all notifications as read", 500, error);
  }
};

module.exports = {
  createEmergency,
  getActiveEmergencies,
  getEmergency,
  getNearbyEmergencies,
  respondToEmergency,
  updateEmergencyStatus,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};