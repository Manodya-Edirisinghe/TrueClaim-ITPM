import express from "express";
import Feedback from "../models/Feedback";

const router = express.Router();

// POST feedback
router.post("/", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();

    res.status(201).json({ message: "Feedback saved!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;