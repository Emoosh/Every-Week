import jwt from "jsonwebtoken"; // ✅ Bu import eksikti!
import { connectDB } from "../Database/db.js";
import { ObjectId } from "mongodb";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Yetkilendirme token'ı eksik" 
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token eksik" 
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ userId field adını düzeltin - token'da 'id' olarak geliyor
    const userId = decoded.userId || decoded.id; // Her iki durumu da handle et
    
    if (!userId) {
      console.log("❌ No userId found in token");
      return res.status(401).json({ 
        success: false, 
        message: "Token'da kullanıcı ID'si bulunamadı" 
      });
    }

    // Kullanıcıyı database'den getir
    const database = await connectDB();
    const user = await database.collection("users").findOne({ 
      _id: new ObjectId(userId) // ✅ Artık doğru userId kullanılıyor
    });

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({ 
        success: false, 
        message: "Kullanıcı bulunamadı" 
      });
    }

    // req.user'a kullanıcı bilgilerini ekle
    req.user = {
      id: user._id,
      e_mail: user.mail || user.e_mail,
      username: user.username,
      role: user.role, // ✅ Database'den güncel role alınacak
      schoolName: user.schoolName
    };

    console.log(req.user);
    
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        success: false, 
        message: "Geçersiz token" 
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false, 
        message: "Token süresi dolmuş" 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: "Sunucu hatası" 
    });
  }
};

export default authMiddleware;