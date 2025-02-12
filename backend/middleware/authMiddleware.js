import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Yetkisiz erişim! Token eksik." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token Doğrulandı:", decoded);  // 🔍 Token'ı konsola yazdır
    req.user = decoded;  // Token'dan gelen bilgiyi req.user'a ata
    next();
  } catch (error) {
    console.error("❌ Token Doğrulama Hatası:", error);  // 🔍 Hata mesajını göster
    return res.status(403).json({ success: false, message: "Geçersiz veya süresi dolmuş token!" });
  }
};

export default authMiddleware;
