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
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Token doğrulama
    req.user = decoded; // Kullanıcı bilgilerini req.user içine ekliyoruz
    next();             // Bir sonraki middleware veya route'a geç
  } catch (error) {
    return res.status(403).json({ success: false, message: "Geçersiz veya süresi dolmuş token!" });
  }
};

export default authMiddleware;
