import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document
 {
    userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  deadline?: Date;
  timeSpent: number; // Dakika cinsinden tutacağız
  priority: 'low' | 'medium' | 'high'; // Yeni eklenen: Öncelik [cite: 202]
  status: 'todo' | 'doing' | 'done';  // Yeni eklenen: Durum [cite: 205]
  estimated_pomodoros?: number;
  completed: boolean;
}

const TaskSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "Genel" },
    deadline: { type: Date },
    timeSpent: { type: Number, default: 0 },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
    status: { 
      type: String, 
      enum: ['todo', 'doing', 'done'], 
      default: 'todo' 
    },

// Analiz için kritik alanlar:
  pomodoroSessions: { type: Number, default: 0 }, // Tamamlanan 25dk'lık seans sayısı
  actualMinutes: { type: Number, default: 0 },    // Toplam harcanan dakika
  completedAt: { type: Date },

    estimated_pomodoros: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);