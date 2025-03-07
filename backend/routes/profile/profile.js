import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { connectDB, getPublicUserProfile } from "../../Database/db.js";
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
        name: user.name || user.username,
        email: user.email || user.e_mail,
        createdAt: user.createdAt,
        role: user.role || "user",        // Role bilgisini ekliyoruz
        schoolName: user.schoolName       // Okul bilgisini ekliyoruz
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

// Kullanıcının herkese açık profil bilgilerini getir (auth gerektirmez)
router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ObjectId formatına dönüştür
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID formatı."
      });
    }
    
    // Herkese açık profil bilgilerini getir
    const profileData = await getPublicUserProfile(objectId);
    
    if (!profileData) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı."
      });
    }
    
    // Herkese açık profil verilerini döndür
    res.status(200).json({
      success: true,
      profile: profileData
    });
    
  } catch (error) {
    console.error("Herkese açık profil hatası:", error);
    res.status(500).json({
      success: false,
      message: "Profil bilgileri alınırken bir hata oluştu."
    });
  }
});

export default router;
