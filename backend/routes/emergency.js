const express = require('express');
const emergencyRouter = express.Router();
const { createEmergency, getActiveEmergencies, getNearbyEmergencies,getEmergency, respondToEmergency, updateEmergencyStatus } = require('../controllers/emergencycontroler');
const userMiddleware = require('../middleware/usermiddeware');

// Create a new emergency report
emergencyRouter.post('/create', userMiddleware, createEmergency);

// Get all active emergencies
emergencyRouter.get("/all", userMiddleware, getActiveEmergencies);

// Get nearby emergencies (requires longitude & latitude query params)
emergencyRouter.get('/nearby', userMiddleware, getNearbyEmergencies);

// Respond to an emergency
emergencyRouter.post('/:emergencyId/respond', userMiddleware, respondToEmergency);

// Update emergency status (resolved, cancelled, etc.)
emergencyRouter.patch('/:emergencyId/status', userMiddleware, updateEmergencyStatus);
emergencyRouter.get("/:emergencyId",userMiddleware,getEmergency);
module.exports = emergencyRouter;
