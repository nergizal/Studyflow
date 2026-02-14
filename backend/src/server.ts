import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import { connectDB } from "./config/db";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("StudyFlow API çalışıyor 🚀");
});

app.use("/api/tasks", taskRoutes);

const PORT = 5001;

connectDB();


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
