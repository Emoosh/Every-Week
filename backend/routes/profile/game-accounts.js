import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { saveGameAccounts, getGameAccounts, getGameMatchHistory } from "../../Database/db.js";

const router = express.Router();

// Kullanıcının oyun hesaplarını kaydetme
router.post("/save-accounts", authMiddleware, async (req, res) => {
  try {
    // JWT token contains 'id' not '_id'
    const userId = req.user.id.toString();
    const { league, valorant } = req.body;
    
    // En az bir oyun hesabı olmalı
    if ((!league || ((!league.gameName || league.gameName.trim() === '') && (!league.tagLine || league.tagLine.trim() === ''))) && 
        (!valorant || ((!valorant.gameName || valorant.gameName.trim() === '') && (!valorant.tagLine || valorant.tagLine.trim() === '')))) {
      return res.status(400).json({
        success: false,
        message: "En az bir oyun hesabı için en az bir bilgi (Oyun Adı veya Tag) girilmelidir."
      });
    }
    
    // Oyun hesaplarını kaydet
    const gameAccounts = {};
    
    // League of Legends hesabı
    if (league && (league.gameName || league.tagLine)) {
      gameAccounts.league = {
        gameName: league.gameName || "",
        tagLine: league.tagLine || ""
      };
    }
    
    // Valorant hesabı
    if (valorant && (valorant.gameName || valorant.tagLine)) {
      gameAccounts.valorant = {
        gameName: valorant.gameName || "",
        tagLine: valorant.tagLine || ""
      };
    }
    
    const result = await saveGameAccounts(userId, gameAccounts);
    
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
  try {
    // JWT token contains 'id' not '_id'
    const userId = req.user.id.toString();
    const { gameType } = req.params; // Opsiyonel ('league' veya 'valorant')
    const limit = parseInt(req.query.limit) || 10;
    
    const matches = await getGameMatchHistory(userId, gameType, limit);

    res.status(200).json({
      success: true,
      matches
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