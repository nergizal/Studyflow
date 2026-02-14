import { Response } from "express";
import PomodoroSession from "../models/PomodoroSession";
import Task from "../models/Tasks";
import { AuthRequest } from "../middleware/authMiddleware";

// POST /api/sessions/complete
export const completeSession = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { taskId, duration, note, startedAt, endedAt } = req.body; //

    // 1. Yeni Pomodoro oturumunu kaydet
    const session = await PomodoroSession.create({
      userId: req.user?.id,
      taskId: taskId || undefined,
      mode: "focus",
      duration_minutes: duration,
      started_at: startedAt,
      ended_at: endedAt,
      completed: true,
      note
    });

    // 2. Eğer bu oturum bir göreve aitse, o görevin toplam süresini güncelle
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, {
        $inc: { timeSpent: duration } // timeSpent değerini duration kadar arttır
      });
    }

    res.status(201).json(session);
  } catch (error) {
    console.error("Oturum kaydetme hatası:", error);
    res.status(500).json({ message: "Oturum kaydedilemedi." });
  }
};