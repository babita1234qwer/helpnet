const express = require('express');
const locationrouter = express.Router();

const { 
    updateLocation, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/userController');




// Update user location
locationrouter.put('/location', updateLocation);

// Get user profile
locationrouter.get('/profile', getUserProfile);

// Update user profile
locationrouter.put('/profile', updateUserProfile);

module.exports = locationrouter;