import { Router } from "express";
import * as aiService from "../services/aiService";

const router = Router();

// Test için protect eklemiyoruz, direkt erişelim
router.post("/ai-breakdown", async (req, res) => {
  try {
    const { title } = req.body;
    console.log("AI İsteği Geldi:", title); // Terminalde bunu görmelisin
    const result = await aiService.breakdownTask(title);
    res.json(result);
  } catch (error: any) {
    console.error("AI Hatası Detay:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;