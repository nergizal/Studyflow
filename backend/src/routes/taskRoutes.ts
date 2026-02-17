import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// Bütün task rotalarının önüne "protect" ekleyerek dışarıdan erişimi kapatıyoruz
router.get("/", protect, getTasks);
router.post("/", protect, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

export default router;