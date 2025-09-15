const express=require('express');
const app=express();
const http = require('http');
const redisclient =require("./config/redis");
const { Server } = require('socket.io');
const server = http.createServer(app);

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const main=require('./config/db');
const cookieparser=require('cookie-parser');
const cors=require('cors');
const authrouter=require('./routes/userauth');
const io = new Server(server, {
  cors: {
    origin:[
    
    'http://localhost:5173'
  ],
    credentials: true
  }
});
//socketHandler(io);
app.use(cors({
 origin: [
    
    'http://localhost:5173'
  ],
    credentials: true 
}))
app.use(express.json());
app.use(cookieparser());
app.use('/user',authrouter);
const initialiseconnection=async()=>{
      try{
        await Promise.all([main(),redisclient.connect()]);
        console.log("Connected to DB");
       // app.listen(process.env.PORT,()=>{
           // console.log("Server is running on port",process.env.PORT);
       // })
       server.listen(3000, () => {
  console.log("Server running on port", 3000);
});
      }
        catch(err){
            console.log("Error connecting to DB",err);
        }
}

initialiseconnection();