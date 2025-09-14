const Emergency=require("../models/emergency");
const User=require("../models/user");
const Notification=require("../models/notification");
const mongoose =require("mongoose");
const axios=require("axios");
const config=require("../config/config");
const socketService=require("../services/socketservice");

function sendSuccess(res,data,message="Success",status=200){
    return res.status(status).json({
        success:true,
        message,
        data,
    });
}

function sendError(res,message="Error",status=500,error=null){
    return res.status(status).json({
        success:false,
        message,
        error:error?.message||null,
    });
}

const EVENTS={
    NEW_EMERGENCY:"newEmergency",
    EMERGENCY_CREATED:"emergencyCreated",
    RESPONDER_ADDED:"responderAdded",
    RESPONDER_UPDATED:"responderUpdated",
    EMERGENCY_STATUS_UPDATED:"emergencyStatusUpdated",
    EMERGENCY_RESOLVED:"emergencyResolved",
}

const createEmergency=async(req,res)=>{
    try{
      const {emergencyType,description,longitude,latitude}=req.body;
      const userId=req.userId; //from middleware
      if(!emergency||!description||!longitue||!latitude){
        return sendError(res,"Missing required fiels",400);
      }
      let address="Unknown location";
      try{
        const geoResponse=await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,{ 
            params:{access_token:config.mapbox.accessToken,
            limit:1,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
        }});
       


if(geoResponse.data?.features?.length>0){
    address=geoResponse.data.features[0].place_name;

}
}catch(err){
console.warn("Mapbox geocoding failed,fallback to Unknown location");


}
const emergency=new Emergency({
createdBy:userId,
emergencyType,
description,
location:{coordinates:[parseFloat(longitude),parseFloat(latitude)],


address},
status:"active",});
await emergency.save();
const nearbyUsers=await User.find({
    _id:{
        $ne:userId},
        availabilityStatus:true,
        "currentLocation.lastUpdated":{
            $gte:new Date(Date.now()-30*60*1000),
        },
        "currentLocation.coordinates":{
$near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: 5000,
        },
    },
}).select("_id name");
if(nearbyUsers.length>0){
    const notifications=nearbyUsers.map((user)=({
        userId:user._id
,
emergencyId:emergency._id ,
type:"emergency_alert",
title:`${emergencyType.toUppercase()} EMERGENCY NEARBY`,
message:`Help needed at ${address}.`,
    }));
    await Notification.insertMany(notifications);
}

//emit socket
nearbyUsers.forEach((user)=>{
    socketService.emitToUser(user._id,NEW_EMERGENCY,{
        emergencyId:emergency._id,
        emergencyType,
        description,
        location:emergency.location,
        xreatedAt:emergency.createdAt,});
    });
    socketService.emitToAll(EVENTS.EMERGENCY_CREATED,{
        emergencyId:emergency._id,
        emergencyType,
        location:emergency.location.coordinates,});
    return sendSuccess(res,emergency,"Emergency created successfully",201);
    }
    catch(error){
        console.error("HelpNet::createEmergency error ->",error);
        return sendError(res,"Could not create emergency",500,error);
    };}


    const getActiveEmergencies=async(req,res)=>{
        try{
            const emergencies=await Emergency.find({
                status:{$in:["active","responding"]},}).populate("createdBy","name").sort({createdAt:-1});


            return sendSuccess(res,emergencies,"Active emergencies fetched successfully");}
            catch(error){

                return sendError(res,"Failed to fetch active emergencies",500,error);
            }}
   const getNearbyEmergencies= async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return sendError(res, "Longitude and latitude required", 400);
    }

    const emergencies = await Emergency.find({
      status: { $in: ["active", "responding"] },
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(maxDistance),
        },
      },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return sendSuccess(res, emergencies, "Nearby emergencies retrieved");
  } catch (error) {
    return sendError(res, "Failed to fetch nearby emergencies", 500, error);
  }
};

        
const respondtoEmergency=async(req,res)=>{
  try {
    const { emergencyId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
      return sendError(res, "Invalid emergency ID", 400);
    }

    const emergency = await Emergency.findById(emergencyId);
    if (!emergency) return sendError(res, "Emergency not found", 404);

    if (["resolved", "cancelled"].includes(emergency.status)) {
      return sendError(res, "Emergency already closed", 400);
    }

    // Update or add responder
    let responder = emergency.responders.find(
      (r) => r.userId.toString() === userId
    );
    if (responder) {
      if (responder.status === "notified") {
        responder.status = "en_route";
        responder.respondedAt = Date.now();
      } else if (responder.status === "en_route") {
        responder.status = "on_scene";
        responder.arrivedAt = Date.now();
      } else if (responder.status === "on_scene") {
        responder.status = "completed";
        responder.completedAt = Date.now();
      }
    } else {
      emergency.responders.push({
        userId,
        status: "en_route",
        notifiedAt: Date.now(),
        respondedAt: Date.now(),
      });
    }

    // Mark emergency as responding
    if (emergency.status === "active") emergency.status = "responding";

    await emergency.save();

    // Notify creator
    await Notification.create({
      userId: emergency.createdBy,
      emergencyId: emergency._id,
      type: "response_update",
      title: "Responder update",
      message: "A responder is on the way.",
    });

    // Emit events
    socketService.emitToUser(emergency.createdBy, EVENTS.RESPONDER_ADDED, {
      emergencyId: emergency._id,
      responder: { _id: userId, status: responder?.status || "en_route" },
    });

    socketService.emitToEmergency(emergencyId, EVENTS.RESPONDER_UPDATED, {
      emergencyId: emergency._id,
      responder: { _id: userId, status: responder?.status || "en_route" },
    });

    return sendSuccess(res, { emergency }, "Responder status updated");
  } catch (error) {
    return sendError(res, "Failed to respond to emergency", 500, error);
  }
};
const updateEmergencyStatus=async(req,res)=>{
    try{
        const {emergencyId}=req.params;
        const {status} =req.body;
        const userId=req.userId;
        if(!mongoose.Types.ObjectId.isValid(emergencyId)){
            return sendError(res,"Invalid emergency ID",400);

        }
        if(!["active","responding","resolved","cancelled"].includes(status)){
            return sendError(res,"Invalid status",400);
        }
        const emergency=await Emergency.findById(emergencyId);
        if(!emergency){
            return sendError(res,"Emergency not found",400);

        }
        const isCreator=emergency.createdBy.toString()===userId;
        const isResponder=emergency.respoders.some(
            (r)=>r.userId.toString()===userId&&["en_route","om_scene"].includes(r.status)
        );
        if(!isCreator&&!isResponder){
            return sendError(res,"Not authorized",403);
        }
    emergency.status=status;
    if(status==="resolved"){
        emergency.resolvedAt=Date.now();}
        await emergency.save();
        socketService.emitToEmergency(emergencyId,EVENTS.EMERGENCY_STATUS_UPADATED,{
      emergencyId:emergency,_id,
      status,
      updatedBy:userId,
        });
        if(status==="resolved"){
            socketService.emitToAll(EVENTS.EMERGENCY_RESOLVED,{
                emergencyId:emergency._id,
            });
        }
        return sendSuccess(res,{emergency},"Emergency status updated");
    }catch(error){
        return sendError(res,"Failed to update emergency status",500,error);}};
    
        
 module.exports={createEmergency,getActiveEmergencies,getNearbyEmergencies,respondtoEmergency,updateEmergencyStatus};
    
    




