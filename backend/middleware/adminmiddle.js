const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisclient = require("../config/redis");

const JWT_SECRET = "01b0142fc8369a6b8046bc0f6fbbda6b910b173fa0b5ae6af833cb48107a5892";


const adminMiddleware = async (req, res, next) => {
    try{
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if(!token){
            throw new Error("missing token");
        }
        console.log(JWT_SECRET);
        let payload;
        try{ payload=jwt.verify(token,JWT_SECRET);}
        catch(err){
            console.log(err);   }
        
            const{_id}=payload;
        if(!_id){

            throw new Error("invalid token");}
            

            
        
        const result=await User.findById(_id);
        if(payload.role!='admin'){
            throw new Error("not valid token");
        }
        
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

    module.exports=adminMiddleware; 