import express from "express";
import fetch from "node-fetch";
import { saveRiotInformations } from "../../../Database/db.js"; // MongoDB bağlantısı
import authMiddleware from "../../../middleware/authMiddleware.js"; // JWT doğrulama için
import dotenv from "dotenv";
dotenv.config();

const api_key = process.env.RIOT_APIKEY;
const router = express.Router();

//This method stands for updating the user's match history by api requests.

export async function UpdateMatchHistory(gameName, tagLine, userId) {
  if (!gameName || !tagLine) {
    console.error("UpdateMatchHistory: Game name and tag must be entered!");
    return { 
      success: false, 
      error: "Game name and tag must be entered!" 
    };
  }

  try {
    const puidData = await findPUID(gameName, tagLine);
    console.log("Step 1 OK - PUID found");
    
    const lastMatchIDTable = await findLastMatches(puidData.puuid);
    console.log("Step 2 OK - Match IDs found:", lastMatchIDTable.length);
    
    const matchSummaries = await getMatchSummariesWithDelay(lastMatchIDTable, puidData.puuid, 10);
    console.log("Step 3 OK - Match summaries created:", matchSummaries.length);
    
    const dbResult = await saveRiotInformations(userId, gameName, tagLine, puidData.puuid, matchSummaries);
    console.log("Step 4 OK - Saved to database");

    if (!dbResult.success) {
      throw new Error(dbResult.error);
    }

    return {
      success: true,
      message: "Maç geçmişi başarıyla güncellendi.",
      matchCount: matchSummaries.length,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error("UpdateMatchHistory Error:", error);
    return { 
      success: false, 
      error: error.message || "Maç geçmişi güncellenirken bir sorun oluştu." 
    };
  }
}

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

//This find user's last matches

async function findLastMatches(puuid) {
  const url = `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${api_key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${data.message || "Unknown error"}`);
    }

    return data;
  } catch (error) {
    console.error("❌ findLastMatches API Request Failed:", error);
    throw error;
  }
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMatchSummariesWithDelay(matchIds, puuid, delayMs = 10) {
  const results = [];
  for (const matchId of matchIds) {
    try {
      const summary = await findMatchSummary(matchId, puuid);
      results.push(summary);
    } catch (error) {
      console.error(`Hata oluştu (matchId: ${matchId}):`, error);
    }
    // Her istek arasında delayMs kadar bekle
    await delay(delayMs);
  }
  return results;
}


async function findMatchSummary(matchId, puuid) {
  const url = `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${api_key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${data.message || "Unknown error"}`);
    }

    const player = data.info.participants.find(p => p.puuid === puuid);

    return {
      matchId: matchId,
      gameMode: data.info.gameMode,
      gameDuration: `${Math.floor(data.info.gameDuration / 60)} min ${data.info.gameDuration % 60} sec`,
      champion: player ? player.championName : "Unknown",
      kills: player ? player.kills : 0,
      deaths: player ? player.deaths : 0,
      assists: player ? player.assists : 0,
      win: player ? player.win : false,
      goldEarned: player ? player.goldEarned : 0,
      totalMinionsKilled: player ? player.totalMinionsKilled + player.neutralMinionsKilled : 0,
      teamPosition: player ? player.teamPosition : "Unknown"
    };
  } catch (error) {
    console.error("❌ findMatchSummary API Request Failed:", error);
    throw error;
  }
}
// API endpoint to manually trigger match history update
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameName, tagLine } = req.body;
    
    if (!gameName || !tagLine) {
      return res.status(400).json({ 
        success: false, 
        error: "Oyun adı ve tag zorunludur." 
      });
    }
    
    console.log(`🔄 Manual update requested for ${gameName}#${tagLine}`);
    
    // API çağrısı ile güncelleme başlat
    const result = await UpdateMatchHistory(gameName, tagLine, userId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `${result.matchCount} maç başarıyla güncellendi.`,
        lastUpdated: result.lastUpdated
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Match history update error:", error);
    return res.status(500).json({
      success: false,
      error: "Maç geçmişi güncellenirken bir hata oluştu."
    });
  }
});

export default router;
