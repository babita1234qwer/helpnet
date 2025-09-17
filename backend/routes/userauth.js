const express = require('express');

const authRouter =  express.Router();
const {register, login,logout, adminregister} = require('../controllers/authentication')
const userMiddleware = require("../middleware/usermiddeware");
const adminMiddleware = require('../middleware/adminmiddle');


authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);
authRouter.post('/admin/register', adminMiddleware ,adminregister);
//authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
// authRouter.get('/getProfile',getProfile);
authRouter.get('/check', userMiddleware, (req, res) => {
  res.status(200).json({ user: req.user }); // wrap in { user: ... }
});

module.exports = authRouter;

