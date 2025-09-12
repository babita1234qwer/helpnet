const User = require('../models/user');
const validate=require('../utils/validator');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const redisclient=require('../config/redis');

const register=async (req, res) => {
    try{
        validate(req.body);
        const{name,email,password}=req.body;
        req.body.password=await bcrypt.hash(password,10);
        req.body.role="user";
        const user=await User.create(req.body);
        const token= jwt.sign({id:user.id,email:email,role:"user"},process.env.JWT_SECRET,{expiresIn:'1h'});
        const reply={
            name:user.name,
            email:user.email,
            id:user.id,
            role:user.role
        }
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(201).json({user:reply,message:'User created successfully',token:token});
       
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err.message});
    }}
const login=async (req, res) => {
    try{
        const {email,password}=req.body;
        if(!email){
            throw new Error("invalid credential");
        }
        if(!password){
            throw new Error("invalid credential");
        }


        const user=await User.findOne({email:email});
        const match= await bcrypt.compare(password,user.password);
        if(!match){
            throw new Error("invalid credential");
        }
        const reply={
            name:user.name,
            email:user.email,
            id:user.id,
            role: user.role 
        }
        const token= jwt.sign({id:user.id,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(200).json({ user:reply,message:'User logged in successfully',token:token});
    }
        catch(err){
            console.log(err);
            res.status(401).send({message:err.message});
        }}
const logout=async (req, res) => {
    try{
        
        const {token}=req.cookies;
        if(!token){
            throw new Error("invalid token");
        }
        const payload= jwt.decode(token);
        await redisclient.set(`token:${token}`,"blocked");
        await redisclient.expireAt(`token:${token}`,payload.exp);
        res.cookie('token', null, { expires: new Date(Date.now()) });
        res.send({message:'User logged out successfully'});
        
    }
    catch(err){
    
        console.log(err);
        res.status(503).send({message:err.message});
    }
}

const adminregister=async (req, res) => {
        try{
        validate(req.body);
        const{name,email,password}=req.body;
        req.body.password=await bcrypt.hash(password,10);
        req.body.role="admin";
        const user=await User.create(req.body);
        const token= jwt.sign({id:user.id,email:email,role:"admin"},process.env.JWT_SECRET,{expiresIn:'1h'});
        res.cookie('token', token, {
  maxAge: 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'none',
  secure: true
});
        res.status(201).send({message:'User created successfully',token:token});
       
    }
    catch(err){
        console.log(err);
        res.status(400).send({message:err.message});
    }}


module.exports={
    register,
    login,
    logout,
    adminregister
}
