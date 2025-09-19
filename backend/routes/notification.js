const express = require('express');
const notificationRouter = express.Router();
const { getUserNotifications,markNotificationAsRead,markAllNotificationsAsRead} = require('../controllers/emergencycontroler');
const userMiddleware = require('../middleware/usermiddeware');

notificationRouter.get('/notifications',userMiddleware,getUserNotifications);
notificationRouter.put("/notifications/:notificationId/read",userMiddleware,markNotificationAsRead);
notificationRouter.put("notifications/read-all",userMiddleware,markAllNotificationsAsRead);
module.exports=notificationRouter;