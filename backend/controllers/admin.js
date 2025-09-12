const CrisisRequest = require("../models/crisisschema");

// ----------------------
// Helper function: detect suspicious requests
// ----------------------
const isSuspicious = (request) => {
  // No title or description
  if (!request.title || !request.description) return true;

  // No resources needed
  if (!request.resourcesNeeded || request.resourcesNeeded.length === 0) return true;

  // Repeated keywords in title
  const suspiciousPattern = /help\s+help|urgent\s+urgent/i;
  if (suspiciousPattern.test(request.title)) return true;

  // Optional: check coordinates are within valid bounds
  const [lng, lat] = request.location.coordinates;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return true;

  return false;
};

// ----------------------
// Get requests for admin dashboard with filters
// GET /api/admin/requests?status=pending|verified|all
// ----------------------
const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query; // optional filter

    let query = {};
    if (status === "pending") query.verifiedByAdmin = false;
    else if (status === "verified") query.verifiedByAdmin = true;

    const requests = await CrisisRequest.find(query)
      .populate("requester", "name role")
      .sort({ createdAt: -1 });

    // Add a suspicious flag for each request
    const requestsWithSuspicion = requests.map((r) => {
      const rObj = r.toObject();
      rObj.suspicious = isSuspicious(r);
      return rObj;
    });

    res.json(requestsWithSuspicion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// Verify a request by ID
// PATCH /api/admin/requests/verify/:id
// ----------------------
const verifyRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await CrisisRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only verify if currently unverified
    if (request.verifiedByAdmin) {
      return res.status(400).json({ message: "Request is already verified" });
    }

    request.verifiedByAdmin = true;
    await request.save();

    res.json({ message: "Request verified successfully", request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------
// Delete a request by ID (spam/fake)
// DELETE /api/admin/requests/:id
// ----------------------
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await CrisisRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllRequests, verifyRequest, deleteRequest };
