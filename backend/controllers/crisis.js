// controllers/requestController.js
const CrisisRequest = require("../models/crisisschema");

// ----------------------
// Create a new crisis request
// ----------------------
const createRequest = async (req, res) => {
  try {
    const { title, description, resourcesNeeded, location } = req.body;

    if (!title || !description || !location || !location.coordinates) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    const request = new CrisisRequest({
      title,
      description,
      requester: req.user._id,
      resourcesNeeded,
      location, // { type: "Point", coordinates: [lng, lat] }
      status: "pending",
      verifiedByAdmin: false
    });

    const savedRequest = await request.save();

    // Emit via Socket.IO if instance is attached to app
    if (req.app.get("io")) {
      req.app.get("io").emit("newRequest", savedRequest);
    }

    res.status(201).json(savedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// Get crisis requests
// Optional query parameters:
// - lng, lat, radius (meters) → filter by nearby location
// - resources → comma-separated list, e.g., "water,food"
// ----------------------
const getRequests = async (req, res) => {
  try {
    const { lng, lat, radius = 5000, resources } = req.query;

    let query = {};

    // Filter by resources if provided
    if (resources) {
      const resourceArray = resources.split(",").map((r) => r.trim());
      query.resourcesNeeded = { $in: resourceArray };
    }

    // Filter by nearby location if lng & lat provided
    if (lng && lat) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      };
    }

    const requests = await CrisisRequest.find(query)
      .populate("requester", "name role");

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createRequest, getRequests };
