const express = require('express');
const app = express();
const http = require('http');
const redisclient = require("./config/redis");
const locationuser = require('./routes/location');
const socket = require('./config/socket'); // Import the socket utility
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const main = require('./config/db');
const cookieparser = require('cookie-parser');
const cors = require('cors');
const authrouter = require('./routes/userauth');
const emergencyRouter = require('./routes/emergency');
const notificationRouter = require("./routes/notification");

const server = http.createServer(app);

// Initialize socket.io
const io = socket.init(server);

// Set up socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected with ID:', socket.id);
  
  // Join user-specific room
  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Join emergency-specific room
  socket.on('join-emergency-room', (emergencyId) => {
    socket.join(`emergency:${emergencyId}`);
    console.log(`User joined emergency ${emergencyId} room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected with ID:', socket.id);
  });
});

// Make io globally accessible if needed
global.io = io;

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true 
}));

app.use(express.json());
app.use(cookieparser());
app.use('/user', authrouter);
app.use('/emergencies', emergencyRouter);
app.use('/location', locationuser);
app.use("/notifications", notificationRouter);

const initialiseconnection = async () => {
  try {
    await Promise.all([main(), redisclient.connect()]);
    console.log("Connected to DB");
    
    server.listen(3001, () => {
      console.log("Server running on port", 3001);
    });
  } catch(err) {
    console.log("Error connecting to DB", err);
  }
};

initialiseconnection();