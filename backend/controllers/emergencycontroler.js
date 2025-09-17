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
const EVENTS={
    NEW_EMERGENCY:"newEmergency",
    EMERGENCY_CREATED:"emergencyCreated",
    RESPONDER_ADDED:"responderAdded",
    RESPONDER_UPDATED:"responderUpdated",
    EMERGENCY_STATUS_UPDATED:"emergencyStatusUpdated",
    EMERGENCY_RESOLVED:"emergencyResolved",
}


const createEmergency = async (req, res) => {
  try {
    const { emergencyType, description, longitude,latitude} = req.body;
    const userId = req.user._id;

    if (!emergencyType || !description || !longitude || !latitude) {
      return errorResponse(res, "Missing required fields", 400);
    }

    // 📍 Reverse Geocoding with Google API
    let address = "Unknown location";
    try {
      const geoRes = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${"AIzaSyBX2dkhTiyuh0Yji3uTeiuFy51BaeqXgCk"}`
      );
      if (geoRes.data.results?.length > 0) {
        address = geoRes.data.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Error in Google Reverse Geocoding:", error.message);
    }

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

    // 🔎 Find nearby users (within 5km, updated within 30 mins)
    const nearbyUsers = await User.find({
      _id: { $ne: userId },
      availabilityStatus: true,
      "currentLocation.lastUpdated": {
        $gte: new Date(Date.now() - 30 * 60 * 1000),
      },
      "currentLocation.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 5000,
        },
      },
    }).select("_id name");

    // Create notifications
    const notifications = nearbyUsers.map((user) => ({
      userId: user._id,
      emergencyId: emergency._id,
      type: "emergency_alert",
      title: `${emergencyType.toUpperCase()} EMERGENCY NEARBY`,
      message: `Someone needs help with a ${emergencyType} emergency near ${address}. Can you respond?`,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // 🔔 Emit socket events to nearby users
    nearbyUsers.forEach((user) => {
      emitToUser(user._id,NEW_EMERGENCY, {
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
  createdBy: emergency.createdBy, // important!
  location: emergency.location,   // full object
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

// Get emergency details
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
    const userId = req.userId;

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

    // 🚗 ETA calculation via Google Directions API
    try {
      const user = await User.findById(userId).select("currentLocation");
      if (user?.currentLocation?.coordinates) {
        const [lng, lat] = user.currentLocation.coordinates;
        const [emLng, emLat] = emergency.location.coordinates;

        const dirRes = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${emLat},${emLng}&key=${AIzaSyBX2dkhTiyuh0Yji3uTeiuFy51BaeqXgCk}}`
        );

        const route = dirRes.data?.routes?.[0];
        if (route && route.legs?.[0]) {
          const etaSeconds = route.legs[0].duration.value;
          const etaTimestamp = new Date(Date.now() + etaSeconds * 1000);

          const idx = emergency.responders.findIndex(
            (r) => r.userId.toString() === userId
          );
          if (idx !== -1) {
            emergency.responders[idx].eta = {
              seconds: etaSeconds,
              timestamp: etaTimestamp,
            };
          }
        }
      }
    } catch (err) {
      console.error("Google ETA calculation failed:", err.message);
    }

    await emergency.save();

    // Notify creator
    await Notification.create({
      userId: emergency.createdBy,
      emergencyId: emergency._id,
      type: "response_update",
      title: "Responder on the way",
      message: "A responder is on the way to help you.",
    });

    // Emit sockets
    emitToUser(emergency.createdBy, RESPONDER_ADDED, {
      emergencyId: emergency._id,
      responder: {
        _id: userId,
        status: responder ? responder.status : "en_route",
      },
    });

    emitToEmergency(emergencyId, RESPONDER_UPDATED, {
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
    const userId = req.userId;

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

    // Emit socket event to all responders and the creator
    emitToEmergency(
      emergencyId,
      EMERGENCY_STATUS_UPDATED,
      {
        emergencyId: emergency._id,
        status: emergency.status,
        updatedBy: userId,
      }
    );

    // If resolved, also broadcast to all
    if (status === "resolved") {
      emitToAll(EMERGENCY_RESOLVED, {
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
module.exports={createEmergency,getActiveEmergencies,getEmergency,getNearbyEmergencies,respondToEmergency,updateEmergencyStatus}