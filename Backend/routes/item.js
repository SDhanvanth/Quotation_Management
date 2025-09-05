import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM Item WHERE isActive = 1"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching items" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { item_name, item_description, category_id, created_by } = req.body;

    if (!item_name || !created_by) {
      return res
        .status(400)
        .json({ message: "item_name and created_by are required" });
    }

    const [result] = await pool.execute(
      `INSERT INTO Item (item_name, item_description, category_id, created_by) 
       VALUES (?, ?, ?, ?)`,
      [item_name, item_description, category_id, created_by]
    );

    res
      .status(201)
      .json({ message: "Item created", item_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, item_description, category_id, isActive } = req.body;

    const [result] = await pool.execute(
      `UPDATE Item 
       SET item_name = ?, item_description = ?, category_id = ?, isActive = ? 
       WHERE item_id = ?`,
      [item_name, item_description, category_id, isActive, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE Item SET isActive = 0 WHERE item_id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted (soft delete)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting item" });
  }
});

export default router;