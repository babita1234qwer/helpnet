const express = require('express');
const locationrouter = express.Router();
const { protect } = require('../middleware/auth');
const { 
    updateLocation, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/userController');

// All routes require authentication
locationrouter.use(protect);

// Update user location
locationrouter.put('/location', updateLocation);

// Get user profile
locationrouter.get('/profile', getUserProfile);

// Update user profile
locationrouter.put('/profile', updateUserProfile);

module.exports = router;