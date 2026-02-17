import { GoogleGenerativeAI } from "@google/generative-ai";

export const breakdownTask = async (title: string) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Anahtarı eksik!");
  }

  // SDK'yı tam burada, istek geldiğinde başlatıyoruz
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `Sen profesyonel bir mühendissin. "${title}" görevini 5 alt adıma böl. Yanıtı SADECE şu JSON formatında ver: {"subtasks": ["adım 1", "adım 2", ...]}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Hatası:", error);
    throw error;
  }
};