import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import sessionRoutes from "./routes/sessionRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("StudyFlow API çalışıyor 🚀");
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes)

const PORT = 5001;

connectDB();


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
