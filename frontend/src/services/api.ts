
//Bu bir github proje pr denemesidir.
import axios from "axios";
import type { Task } from "../types";

const BASE_URL = "http://localhost:5001/api";

// JWT Token'ı otomatik olarak her isteğe eklemek için bir axios instance (kopyası) oluşturuyoruz
const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("studyflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTH İSTEKLERİ ---
export const login = async (credentials: any) => {
  const response = await apiClient.post("/auth/login", credentials);
  return response.data;
};

export const register = async (userData: any) => {
  const response = await apiClient.post("/auth/register", userData);
  return response.data;
};

// --- TASK İSTEKLERİ ---
export const getTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get("/tasks");
  return response.data;
};

export const createTask = async (taskData: any): Promise<Task> => {
  const response = await apiClient.post("/tasks", taskData);
  return response.data;
};

export const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
  const response = await apiClient.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await apiClient.delete(`/tasks/${id}`);
};

export const completeSession = async (sessionData: any) => {
  const response = await apiClient.post("/sessions/complete", sessionData);
  return response.data;
};