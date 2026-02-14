import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Express'in Request objesine kendi user'ımızı ekliyoruz
export interface AuthRequest extends Request {
  user?: { id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): any => {
  let token;

  // İstek başlığında (header) "Bearer token..." formatında anahtar var mı bakıyoruz
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Sadece token kısmını al
      
      // Token'ı çöz ve içindeki kullanıcı ID'sini al
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_gizli_anahtar_123") as { id: string };
      
      // Kullanıcı ID'sini request'e ekle ki controller'lar kimin istek attığını bilsin
      req.user = { id: decoded.id };
      
      next(); // Her şey yolundaysa işleme devam et
    } catch (error) {
      return res.status(401).json({ message: "Yetkisiz erişim, geçersiz token." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim, token bulunamadı." });
  }
};