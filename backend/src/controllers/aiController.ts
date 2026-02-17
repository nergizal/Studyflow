import { GoogleGenerativeAI } from "@google/generative-ai";

// Anahtarı güvenli şekilde dosyadan okuyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getTaskBreakdown = async (req: any, res: any) => {
  try {
    const { title } = req.body; // Kullanıcının girdiği görev başlığı (Örn: "Ders çalış")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Girdi: "${title}". Bu ana görevi başarmak için yapılması gereken 3 mantıklı alt görevi belirle. 
    Sadece JSON array döndür. Örnek: ["Adım 1", "Adım 2", "Adım 3"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON temizliği ve frontend'e gönderme
    const subtasks = JSON.parse(text.replace(/```json|```/g, ""));
    res.json({ subtasks });
  } catch (error) {
    res.status(500).json({ message: "AI şu an meşgul." });
  }
};