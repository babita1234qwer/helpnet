const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisclient = require("../config/redis");




const userMiddleware = async (req, res, next) => {
    try{
            const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if(!token){
            throw new Error("invalid token");
        }
        const payload=jwt.verify(token,process.env.JWT_SECRET);
        const{_id}=payload;
        if(!_id){
            throw new Error("invalid token");
        }
        const result=await User.findById(_id);
        if(!result){
            throw new Error("user doesn't exist");
        }
        const isblocked=await redisclient.exists(`token:${token}`);
        if(isblocked){
            throw new Error("user is blocked");
        }
        req.user = result;
        next();

    }
    catch(err){
        console.log(err);
        res.status(401).send({message:err.message});
    }}

    module.exports=userMiddleware;