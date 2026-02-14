import mongoose, { Schema, Document } from "mongoose";

export interface IPomodoroSession extends Document {
  userId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  mode: string;
  duration_minutes: number;
  started_at: Date;
  ended_at: Date;
  completed: boolean;
  note?: string;
}

const PomodoroSessionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    mode: { type: String, default: "focus" }, // focus, short_break, long_break
    duration_minutes: { type: Number, required: true }, // 25/5/15 vs
    started_at: { type: Date, required: true },
    ended_at: { type: Date, required: true },
    completed: { type: Boolean, default: true },
    note: { type: String, default: "" } // "Bu oturumda ne yaptın?" notu
  },
  { timestamps: true }
);

export default mongoose.model<IPomodoroSession>("PomodoroSession", PomodoroSessionSchema);