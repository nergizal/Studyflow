import { Request, Response } from "express";
import Task from "../models/Tasks";

// GET /api/tasks
export const getTasks = async (req: Request, res: Response) => {
  const tasks = await Task.find();
  res.json(tasks);
};

// POST /api/tasks
export const createTask = async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title gerekli" });
  }

  const newTask = await Task.create({ title });
  res.status(201).json(newTask);
};

// PUT /api/tasks/:id
export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  const updated = await Task.findByIdAndUpdate(id, req.body, {
    new: true
  });

  if (!updated) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  res.json(updated);
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await Task.findByIdAndDelete(id);

  if (!deleted) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  res.json({ message: "Task silindi" });
};
