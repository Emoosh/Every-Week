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
    
    // Hesap bilgileri kaydedildikten sonra maç bilgilerini arka planda güncelle
    if (gameAccounts.league && gameAccounts.league.gameName && gameAccounts.league.tagLine) {
      // Asenkron olarak çalıştır, yanıtı bekletme
      setTimeout(() => {
        fetchRiotInfo(userId, gameAccounts.league.gameName, gameAccounts.league.tagLine)
          .then(success => {
            console.log("Riot info update after account save:", success ? "Success" : "Failed");
          })
          .catch(err => {
            console.error("Error updating riot info after account save:", err);
          });
      }, 100);
    }

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

// Bu fonksiyon Riot bilgilerini güncellemek için kullanılır
async function fetchRiotInfo(userId, gameName, tagLine) {
  try {
    if (!gameName || !tagLine || !userId) {
      console.error("❌ fetchRiotInfo: Missing parameters", { userId, gameName, tagLine });
      return;
    }
    
    console.log(`🔄 Updating match history for ${gameName}#${tagLine}`);
    const result = await UpdateMatchHistory(gameName, tagLine, userId);
    
    if (result.success) {
      console.log(`✅ Match history updated successfully: ${result.matchCount} matches`);
      return true;
    } else {
      console.error(`❌ Failed to update match history: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error("❌ fetchRiotInfo error:", error);
    return false;
  }
}

// Kullanıcının oyun hesaplarını getirme
router.get("/accounts", authMiddleware, async (req, res) => {
  try {
    // JWT token contains 'id' not '_id'
    const userId = req.user.id.toString();
    const forceRefresh = req.query.refresh === 'true';
    
    const gameAccounts = await getGameAccounts(userId);

    if (!gameAccounts) {
      return res.status(404).json({
        success: false,
        message: "Kayıtlı oyun hesabı bulunamadı."
      });
    }
    
    // Önce mevcut bilgileri döndürelim
    res.status(200).json({
      success: true,
      accounts: {
        league: gameAccounts.league || null,
        valorant: gameAccounts.valorant || null,
        createdAt: gameAccounts.createdAt,
        updatedAt: gameAccounts.updatedAt
      }
    });
    
    // Arka planda maç geçmişini güncelleyelim (League hesabı varsa)
    if (forceRefresh && gameAccounts.league && 
        gameAccounts.league.gameName && gameAccounts.league.tagLine) {
      
      // Maç geçmişini güncelle (arka planda)
      setTimeout(() => {
        fetchRiotInfo(userId, gameAccounts.league.gameName, gameAccounts.league.tagLine)
          .then(success => {
            console.log(`Background update after account fetch: ${success ? "Success" : "Failed"}`);
          })
          .catch(err => {
            console.error("Background update error:", err);
          });
      }, 100);
    }
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
    const forceRefresh = req.query.refresh === 'true';
    
    const db = await connectDB();
    const lolInfo = await db.collection("Lol-informations").findOne({ userId });
    const gameAccounts = await db.collection("game-accounts").findOne({ userId });
    
    // İlk olarak, var olan verileri hemen dönelim
    if (lolInfo && lolInfo.lastMatchData && lolInfo.lastMatchData.length > 0) {
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
      
      // Mevcut verileri hemen gönder
      res.status(200).json({
        success: true,
        matches: formattedMatches,
        lastUpdated: lolInfo.lastUpdated || null,
        updating: false // Şu an bir güncelleme yapılmıyor
      });
      
      // Eğer forceRefresh istenmişse veya son güncelleme eski ise, arka planda güncelle
      const lastUpdated = lolInfo?.lastUpdated || null;
      const now = new Date();
      
      // Zorunlu yenileme istenmişse veya son güncelleme 1 saatten eski ise güncelle
      if (forceRefresh || !lastUpdated || (now - new Date(lastUpdated) > 3600000)) {
        if (gameAccounts && gameAccounts.league && 
            gameAccounts.league.gameName && gameAccounts.league.tagLine) {
          
          // Güncelleme işlemi başlatıldı
          console.log(`🔄 Background refresh started for user ${userId}`);
          
          // Asenkron olarak güncelle (response beklemeden)
          UpdateMatchHistory(
            gameAccounts.league.gameName, 
            gameAccounts.league.tagLine, 
            userId
          ).then(result => {
            if (result.success) {
              console.log(`✅ Match history updated in background: ${result.matchCount} matches`);
            } else {
              console.error(`❌ Background update failed: ${result.error}`);
            }
          }).catch(err => {
            console.error("Background update error:", err);
          });
        }
      }
    } else {
      // Hiç veri yoksa, Match history veritabanından çekelim
      const matches = await getGameMatchHistory(userId, gameType, limit);
      
      // Veritabanında da yoksa, yeni veri çekmeyi deneyelim
      if (matches.length === 0 && gameAccounts && gameAccounts.league) {
        res.status(200).json({
          success: true,
          matches: [],
          updating: true, // İlk kez veri çekiliyor
          message: "Oyun verileri ilk kez çekiliyor, lütfen bekleyin..."
        });
        
        // Riot API'den veri çekmeyi başlat (asenkron)
        if (gameAccounts.league.gameName && gameAccounts.league.tagLine) {
          UpdateMatchHistory(
            gameAccounts.league.gameName,
            gameAccounts.league.tagLine,
            userId
          ).then(result => {
            console.log("Initial data fetch result:", result.success ? "Success" : "Failed");
          }).catch(err => {
            console.error("Initial data fetch error:", err);
          });
        }
      } else {
        // Veritabanında maç geçmişi varsa döndür
        res.status(200).json({
          success: true,
          matches: matches,
          updating: false
        });
      }
    }
  } catch (error) {
    console.error("Maç geçmişi getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Maç geçmişi getirilirken bir hata oluştu."
    });
  }
});

export default router;