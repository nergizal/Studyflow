import Task from "../models/Tasks";
import mongoose from "mongoose";

export const getTaskAnalytics = async (req: any, res: any) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const stats = await Task.aggregate([
      { $match: { userId: userId } },
      {
        $facet: {
          // 1. Kategori Dağılımı (Pie Chart için)
          categoryStats: [
            { $group: { _id: "$category", value: { $sum: "$actualMinutes" } } },
            { $project: { name: "$_id", value: 1, _id: 0 } }
          ],
          // 2. Günlük Tamamlanan Görevler (Heatmap için)
          dailyStats: [
            { $match: { status: "done", completedAt: { $ne: null } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                count: { $sum: 1 }
              }
            },
            { $project: { date: "$_id", count: 1, _id: 0 } }
          ],
          // 3. Genel Özet (Focus Score hesabı için)
          summary: [
            {
              $group: {
                _id: null,
                totalMinutes: { $sum: "$actualMinutes" },
                totalSessions: { $sum: "$pomodoroSessions" },
                completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: "Analizler yüklenirken hata oluştu" });
  }
};