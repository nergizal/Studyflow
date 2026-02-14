import { Response } from "express";
import Task from "../models/Tasks";
import { AuthRequest } from "../middleware/authMiddleware";

// GET /api/tasks (Sadece GİRİŞ YAPAN kullanıcının görevlerini getirir)
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.user?.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// POST /api/tasks (Görevi oluşturan kişiyi userId olarak ekler)
export const createTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { title, description, category, deadline, priority, estimated_pomodoros } = req.body;

    if (!title) return res.status(400).json({ message: "Başlık gerekli" });

    const newTask = await Task.create({ 
      userId: req.user?.id,
      title,
      description,
      category,
      deadline,
      priority: priority || 'medium',
      estimated_pomodoros: estimated_pomodoros || 1,
      status: 'todo'
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: "Görev oluşturulamadı." });
  }
};

// PUT /api/tasks/:id (Sadece kendi görevini güncelleyebilir)
export const updateTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const updated = await Task.findOneAndUpdate(
      { _id: id, userId: req.user?.id }, // Hem task ID'si hem User ID'si eşleşmeli
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Görev bulunamadı veya yetkiniz yok." });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// DELETE /api/tasks/:id (Sadece kendi görevini silebilir)
export const deleteTask = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const deleted = await Task.findOneAndDelete({ _id: id, userId: req.user?.id });

    if (!deleted) return res.status(404).json({ message: "Görev bulunamadı veya yetkiniz yok." });
    res.json({ message: "Task silindi" });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası." });
  }
};