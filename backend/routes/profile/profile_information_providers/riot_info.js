import express from "express";
import fetch from "node-fetch"; 
import { connectDB } from "../../../Database/db.js"; // MongoDB bağlantısı
import authMiddleware from "../../../middleware/authMiddleware.js"; // JWT doğrulama için
import dotenv from "dotenv";
dotenv.config();

const api_key = process.env.RIOT_APIKEY;
const router = express.Router();

// 📌 Kullanıcı giriş yaptığında PUID bilgisini getirip veritabanına kaydeder
router.post("/", authMiddleware, async (req, res) => {
  const { gameName, tagLine } = req.body;
  const userId = req.user.id;  // 🔑 JWT'den gelen kullanıcı kimliği

  if (!gameName || !tagLine) {
    return res.status(400).json({ error: "Game name and tag must be entered!" });
  }

  try {
    const puidData = await findPUID(gameName, tagLine);

    const db = await connectDB();
    const lolInformationsCollection = db.collection("Lol-informations");

    // 📌 Kullanıcının PUID bilgisini veritabanına kaydet
    await lolInformationsCollection.updateOne(
      { userId },  // Kullanıcının ID'sine göre kayıt yap
      {
        $set: {
          gameName,
          tagLine,
          puid: puidData.puuid,  // Riot API'den gelen puid
          lastUpdated: new Date()
        }
      },
      { upsert: true } // Kayıt yoksa oluştur
    );

    res.status(200).json({
      success: true,
      message: "PUID bilgisi başarıyla kaydedildi.",
      puid: puidData.puuid
    });

  } catch (error) {
    console.error("PUID API Error:", error);
    res.status(500).json({ error: "PUID API ile ilgili bir sorun oluştu." });
  }
});

// 📌 Riot API'den PUID bilgisini çeken fonksiyon
async function findPUID(gameName, tagLine) {
  const url = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${api_key}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
}

export default router;
