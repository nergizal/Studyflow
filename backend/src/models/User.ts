import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password_hash: string;
  daily_goal_pomodoro: number;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    daily_goal_pomodoro: { type: Number, default: 8 } // Varsayılan hedef: Günde 8 Pomodoro
  },
  { timestamps: true } // created_at ve updated_at otomatik eklenir
);

export default mongoose.model<IUser>("User", UserSchema);