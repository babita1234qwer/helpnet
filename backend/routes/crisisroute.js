const express=require("express");
const crisisRouter=express.Router();
const{createcrisis,getcrisis}=require("../controllers/crisis");
const userMiddleware = require("../middleware/usermiddleware");

crisisRouter.post("/createcrisis",userMiddleware,createcrisis);
crisisRouter.get("/getcrisis",userMiddleware,getcrisis);
module.exports=crisisRouter;