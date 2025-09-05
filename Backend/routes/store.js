import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM Store WHERE isActive = 1");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stores" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { user_id, store_name, store_location, created_by } = req.body;

    if (!user_id || !store_name || !created_by) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [result] = await pool.execute(
      `INSERT INTO Store (user_id, store_name, store_location, created_by) 
       VALUES (?, ?, ?, ?)`,
      [user_id, store_name, store_location, created_by]
    );

    res.status(201).json({ message: "Store created", store_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating store" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { store_name, store_location, isActive } = req.body;

    const [result] = await pool.execute(
      `UPDATE Store 
       SET store_name = ?, store_location = ?, isActive = ? 
       WHERE store_id = ?`,
      [store_name, store_location, isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ message: "Store updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating store" });
  }
});

export default router;