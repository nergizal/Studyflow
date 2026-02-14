import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body; // Dokümanda istenen veriler: name, email, pass 

    // 1. Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Bu email ile zaten kayıt olunmuş." });
    }

    // 2. Şifreyi Hash'le (Güvenli hale getir)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Yeni kullanıcıyı veritabanına kaydet
    const newUser = await User.create({
      name,
      email,
      password_hash
    });

    res.status(201).json({ message: "Kayıt başarılı!", userId: newUser._id });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    res.status(500).json({ message: "Sunucu hatası oluştu." });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body; // Dokümanda istenen veriler: email / pass [cite: 47]

    // 1. Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // 2. Şifreyi doğrula
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz şifre." });
    }

    // 3. JWT Token oluştur (Kullanıcıya verilecek dijital anahtar)
    // Not: Gerçek projelerde "gizli_anahtar" kısmı .env dosyasından gelir
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || "super_gizli_anahtar_123", 
      { expiresIn: "7d" } // Token 7 gün geçerli olsun
    );

    res.json({
      message: "Giriş başarılı",
      token, // token/session [cite: 47]
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        daily_goal_pomodoro: user.daily_goal_pomodoro
      }
    });
  } catch (error) {
    console.error("Giriş hatası:", error);
    res.status(500).json({ message: "Sunucu hatası oluştu." });
  }
};