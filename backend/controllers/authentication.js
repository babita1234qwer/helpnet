const User = require('../models/user');
const validate = require('../utils/validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisclient = require('../config/redis');

// 🔑 Hardcoded secret (not recommended for production)
const JWT_SECRET = "01b0142fc8369a6b8046bc0f6fbbda6b910b173fa0b5ae6af833cb48107a5892";

const register = async (req, res) => {
    try {
        validate(req.body);
        const { name, email, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = "user";

        const user = await User.create(req.body);

        const token = jwt.sign(
            { _id: user._id, email},
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const reply = {
            name: user.name,
            email: user.email,
            _id: user._id,
    
        };

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',   // ⚡ better for local dev
            secure: false
        });

        res.status(201).json({ user: reply, message: 'User created successfully', token });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new Error("invalid credential");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("invalid credential");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new Error("invalid credential");
        }

        const reply = {
            name: user.name,
            email: user.email,
            _id: user._id,
            
        };

        const token = jwt.sign(
            { _id: user._id, email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        res.status(200).json({ user: reply, message: 'User logged in successfully', token });
    } catch (err) {
        console.log(err);
        res.status(401).send({ message: err.message });
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            throw new Error("invalid token");
        }

        const payload = jwt.decode(token);
        await redisclient.set(`token:${token}`, "blocked");
        await redisclient.expireAt(`token:${token}`, payload.exp);

        res.cookie('token', null, { expires: new Date(Date.now()) });
        res.send({ message: 'User logged out successfully' });
    } catch (err) {
        console.log(err);
        res.status(503).send({ message: err.message });
    }
};

const adminregister = async (req, res) => {
    try {
        validate(req.body);
        const { name, email, password } = req.body;

        req.body.password = await bcrypt.hash(password, 10);
        

        const user = await User.create(req.body);

        const token = jwt.sign(
            { _id: user._id, email, role: "admin" },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        });

        res.status(201).send({ message: 'Admin created successfully', token });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
};

const deleteprofile = async (req, res) => {
    try {
        const userId = req.result._id;
        if (!userId) {
            throw new Error("User not found");
        }

        await User.findByIdAndDelete(userId);
        res.status(200).send({ message: 'User profile deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: err.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    adminregister,
    deleteprofile
};

