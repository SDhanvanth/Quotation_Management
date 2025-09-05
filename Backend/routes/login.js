import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../db.js';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

const router = express.Router();

router.post("/", async(req,res)=>{
    
    const { username, password } = req.body;

    const [validate] = await pool.execute('SELECT user_id, password FROM user where username = ? and isActive = 1',[req.body.username]);
    //console.log(validate[0]);
    if (validate.length === 0) {
        return res.status(400).json({ message: "Username or password doesn't exist" });
    }
    if (req.body.password === validate[0].password){
        const [user] = await pool.execute('SELECT user_id, username, type_id FROM user where username = ? and isActive = 1',[req.body.username]);
        const token = jwt.sign(user[0], SECRET_KEY, { expiresIn: '1h' });
        return res.json({ success: true, token });
    }  
    res.status(401).json({ success: false, message: "Invalid credentials" });
});

export default router;