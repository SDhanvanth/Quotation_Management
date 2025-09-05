import express from "express";
import pool from "../db.js"; // your mysql2 pool

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { username, password, type_id } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required" });
    }
    const [existing] = await pool.execute(
      "SELECT user_id FROM user WHERE username = ?",
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }
    const [result] = await pool.execute(
      `INSERT INTO user (username, password, type_id) 
       VALUES (?, ?, ?)`,
      [username, password, type_id || null]
    );

    res.status(201).json({
      message: "User created successfully",
      user_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

export default router;
