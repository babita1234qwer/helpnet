const express=require('express');
const app=express();
const http = require('http');
const redisclient =require("./config/redis");
const locationuser= require('./routes/location');
const { Server } = require('socket.io');

const server = http.createServer(app);

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const main=require('./config/db');
const cookieparser=require('cookie-parser');
const cors=require('cors');
const authrouter=require('./routes/userauth');
const emergencyRouter = require('./routes/emergency');
const io = new Server(server, {
  cors: {
    origin:[
    
    'http://localhost:5174'
  ],
    credentials: true
  }
});
//socketHandler(io);
app.use(cors({
 origin: [
    
    'http://localhost:5174'
  ],
    credentials: true 
}))
app.use(express.json());
app.use(cookieparser());
app.use('/user',authrouter);
app.use('/emergency', emergencyRouter);
app.use('/location',locationuser);
const initialiseconnection=async()=>{
      try{
        await Promise.all([main(),redisclient.connect()]);
        console.log("Connected to DB");
       // app.listen(process.env.PORT,()=>{
           // console.log("Server is running on port",process.env.PORT);
       // })
       server.listen(3001, () => {
  console.log("Server running on port", 3001);
});
      }
        catch(err){
            console.log("Error connecting to DB",err);
        }
}

initialiseconnection();