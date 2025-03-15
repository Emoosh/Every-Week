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
    
    console.log("🔍 Public profile request for userId:", userId);
    
    // ObjectId formatına dönüştür
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      console.error("❌ Invalid ObjectId format:", userId);
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID formatı."
      });
    }
    
    // Herkese açık profil bilgilerini getir
    const profileData = await getPublicUserProfile(objectId);
    
    if (!profileData) {
      console.log("❌ User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı."
      });
    }
    
    // Lol-informations koleksiyonundan lastMatchData bilgisini alalım
    const db = await connectDB();
    const lolInfo = await db.collection("Lol-informations").findOne({ userId: userId });
    
    if (lolInfo && lolInfo.lastMatchData) {
      console.log("✅ Found lastMatchData in Lol-informations for userId:", userId);
      
      // game_match_history koleksiyonu yoksa oluşturalım
      if (!(await db.listCollections({ name: "game_match_history" }).hasNext())) {
        console.log("Creating game_match_history collection");
        await db.createCollection("game_match_history");
      }
      
      // Veritabanında kaydedilmiş maç var mı kontrol edelim
      const existingMatch = await db.collection("game_match_history").findOne({ 
        userId: userId,
        gameType: "league"
      });
      
      // Eğer kayıtlı maç yoksa, lastMatchData'yı maç olarak kaydedelim
      if (!existingMatch && lolInfo.lastMatchData) {
        console.log("📝 Creating match record from lastMatchData");
        await db.collection("game_match_history").insertOne({
          userId: userId,
          gameType: "league",
          matchData: lolInfo.lastMatchData,
          createdAt: new Date()
        });
        
        console.log("✅ Match created from lastMatchData");
        
        // ProfileData içindeki recentMatches'i güncelle
        profileData.recentMatches.league = [{
          userId: userId,
          gameType: "league",
          matchData: lolInfo.lastMatchData,
          createdAt: new Date()
        }];
      }
    }
    
    // Herkese açık profil verilerini döndür
    console.log("✅ Returning profile data with match counts - LoL:", 
                profileData.recentMatches.league.length, 
                "Valorant:", profileData.recentMatches.valorant.length);
    
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
