import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { saveGameAccounts, getGameAccounts, getGameMatchHistory } from "../../Database/db.js";
import {connectDB} from "../../Database/db.js";
import riotInfoRouter from './profile_information_providers/riot_info.js'; // dosya yolunuza göre ayarlayın
// ...
const router = express.Router();

router.use("/riot-info", riotInfoRouter);

//This route used to save the user's game nicks.
//This typing will be replaced with oAuth2.0 soon.

router.post("/save-accounts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const { league, valorant } = req.body;
    
    if ((!league || ((!league.gameName || league.gameName.trim() === '') && (!league.tagLine || league.tagLine.trim() === ''))) &&
        (!valorant || ((!valorant.gameName || valorant.gameName.trim() === '') && (!valorant.tagLine || valorant.tagLine.trim() === '')))) {
      return res.status(400).json({
        success: false,
        message: "En az bir oyun hesabı için en az bir bilgi (Oyun Adı veya Tag) girilmelidir."
      });
    }
    
    const gameAccounts = {};
    
    if (league && (league.gameName || league.tagLine)) {
      gameAccounts.league = {
        gameName: league.gameName || "",
        tagLine: league.tagLine || ""
      };
    }
    
    if (valorant && (valorant.gameName || valorant.tagLine)) {
      gameAccounts.valorant = {
        gameName: valorant.gameName || "",
        tagLine: valorant.tagLine || ""
      };
    }
    
    const result = await saveGameAccounts(userId, gameAccounts);
    fetchRiotInfo();

    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: "Oyun hesapları başarıyla kaydedildi.",
      accounts: gameAccounts
    });
  } catch (error) {
    console.error("Oyun hesapları kaydetme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Oyun hesapları kaydedilirken bir hata oluştu."
    });
  }
});

async function fetchRiotInfo() {
  const response = await fetch('/riot-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameName: 'YourGameName', tagLine: 'YourTag' })
  });
  const data = await response.json();
  console.log(data);
}

// Kullanıcının oyun hesaplarını getirme
router.get("/accounts", authMiddleware, async (req, res) => {
  try {
    // JWT token contains 'id' not '_id'
    const userId = req.user.id.toString();
    
    const gameAccounts = await getGameAccounts(userId);

    if (!gameAccounts) {
      return res.status(404).json({
        success: false,
        message: "Kayıtlı oyun hesabı bulunamadı."
      });
    }
    
    res.status(200).json({
      success: true,
      accounts: {
        league: gameAccounts.league || null,
        valorant: gameAccounts.valorant || null,
        createdAt: gameAccounts.createdAt,
        updatedAt: gameAccounts.updatedAt
      }
    });
  } catch (error) {
    console.error("Oyun hesaplarını getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Oyun hesapları getirilirken bir hata oluştu."
    });
  }
});

// Kullanıcının oyun maç geçmişini getirme
router.get("/match-history/:gameType?", authMiddleware, async (req, res) => {
  // Önbelleği devre dışı bırakalım ve her zaman taze veri döndürelim
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const userId = req.user.id.toString();
    const { gameType } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    

    // Direkt olarak Lol-informations koleksiyonundan maç geçmişi bilgisini alalım
    const db = await connectDB();
    const lolInfo = await db.collection("Lol-informations").findOne({ userId });


    if (lolInfo && lolInfo.lastMatchData) {
      console.log("✅ Found matchHistory in Lol-informations with", lolInfo.lastMatchData.length, "matches");
      
      // Frontend'e doğrudan bu maçları gönderelim
      // Her bir maç için bir obje oluşturalım
      const formattedMatches = lolInfo.lastMatchData.slice(0, limit).map((match, index) => {
        return {
          _id: match.matchId || `match_${index}`,
          gameType: "league",
          matchData: {
            champion: match.champion || "Unknown",
            kills: match.kills || 0,
            deaths: match.deaths || 0,
            assists: match.assists || 0,
            win: match.win || false,
            gameDuration: match.gameDuration || "0 min 0 sec", 
            gameMode: match.gameMode || "CLASSIC",
            cs: match.totalMinionsKilled
          },
          createdAt: lolInfo.lastUpdated || new Date()
        };
      });
      
      console.log("First match sample:", formattedMatches[0]);
      
      return res.status(200).json({
        success: true,
        matches: formattedMatches
      });
    }

    
    // Match history veritabanından çekelim
    const matches = await getGameMatchHistory(userId, gameType, limit);
    
    // Maç geçmişi yoksa boş dizi döndürelim
    res.status(200).json({
      success: true,
      matches: matches
    });
  } catch (error) {
    console.error("Maç geçmişi getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Maç geçmişi getirilirken bir hata oluştu."
    });
  }
});

export default router;