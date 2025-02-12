import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { connectDB } from "../../Database/db.js";
import { ObjectId } from "mongodb";  

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = await connectDB();
    const usersCollection = db.collection("users");
    const lolInformationsCollection = db.collection("Lol-informations");

    const userId = req.user.id;  
    console.log("📦 MongoDB Sorgusu için ID:", userId);

    // 📌 Kullanıcı bilgilerini getir
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı."
      });
    }

    // 📌 Kullanıcının LoL bilgilerini getir
    const lolInfo = await lolInformationsCollection.findOne({ userId });

    res.status(200).json({
      success: true,
      message: "Profil bilgileri başarıyla getirildi.",
      user: {
        uid: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      lolInfo: lolInfo || null // Kullanıcının LoL bilgileri varsa ekle, yoksa null döndür
    });

  } catch (error) {
    console.error("Profil hatası:", error);
    res.status(500).json({
      success: false,
      message: "Profil bilgileri alınırken bir hata oluştu."
    });
  }
});

export default router;
