import express from 'express';
import { getTaskAnalytics } from '../controllers/analyticsController';
// Eğer authentication kullanıyorsan auth middleware'ini ekle
// import { protect } from '../middleware/authMiddleware'; 

const router = express.Router();

router.get('/', getTaskAnalytics); // protect middleware varsa araya ekle

export default router;