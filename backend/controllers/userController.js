const User = require('../models/user');

const updateLocation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { longitude, latitude } = req.body;
        
        if (!longitude || !latitude) {
            return res.status(400).json({ message: "Longitude and latitude are required" });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                currentLocation: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                lastUpdated: Date.now()
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json({ 
            message: "Location updated successfully",
            location: user.currentLocation 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update location" });
    }
};

// Add other user-related functions here if needed
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get user profile" });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, phone, skills, notificationPreferences } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (skills) updateData.skills = skills;
        if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;
        
        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json({ 
            message: "Profile updated successfully",
            user 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

module.exports = {
    updateLocation,
    getUserProfile,
    updateUserProfile
};