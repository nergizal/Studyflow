import { Router } from "express";
import { completeSession } from "../controllers/sessionController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// /api/sessions/complete rotasını dışa açıyoruz (Sadece giriş yapanlar için korunuyor)
router.post("/complete", protect, completeSession);

export default router;