import express from "express";
import {
  createTeamNew,
  getTeamsLookingForMembers,
  sendTeamJoinRequest,
  getTeamJoinRequests,
  respondToTeamJoinRequest,
  getUserTeam,
  leaveTeam,
  registerTeamForTournament,
  getUserTeamForTournament
} from "../team/teamDatabase.js";

import authMiddleware from "../../../middleware/authMiddleware.js";

const router = express.Router();

// Takım oluştur
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { teamName, gameType, maxMembers = 5 } = req.body;
    const captainId = req.user._id;
    const schoolName = req.user.schoolName;

    if (!teamName || !gameType) {
      return res.status(400).json({
        success: false,
        message: "Takım adı ve oyun türü gerekli"
      });
    }

    const result = await createTeamNew(captainId, teamName, gameType, schoolName, maxMembers);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Takım oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takım oluşturulurken bir hata oluştu"
    });
  }
});

// Kullanıcının takımını getir
router.get("/my-team", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const teamInfo = await getUserTeam(userId);

    res.status(200).json({
      success: true,
      teamInfo
    });
  } catch (error) {
    console.error("Takım bilgilerini alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takım bilgileri alınırken bir hata oluştu"
    });
  }
});

// Üye arayan takımları listele
router.get("/looking-for-members/:gameType", authMiddleware, async (req, res) => {
  try {
    const { gameType } = req.params;
    const schoolName = req.query.schoolOnly === 'true' ? req.user.schoolName : null;

    const teams = await getTeamsLookingForMembers(gameType, schoolName);

    res.status(200).json({
      success: true,
      teams
    });
  } catch (error) {
    console.error("Takım listesi alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takımlar listelenirken bir hata oluştu"
    });
  }
});

// Takıma katılma isteği gönder
router.post("/join-request", authMiddleware, async (req, res) => {
  try {
    const { captainId, message = "" } = req.body;
    const userId = req.user._id;

    if (!captainId) {
      return res.status(400).json({
        success: false,
        message: "Takım kaptanı ID'si gerekli"
      });
    }

    const result = await sendTeamJoinRequest(userId, captainId, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Katılma isteği gönderme hatası:", error);
    res.status(500).json({
      success: false,
      message: "İstek gönderilirken bir hata oluştu"
    });
  }
});

// Takıma gelen istekleri görüntüle (Kaptan için)
router.get("/join-requests", authMiddleware, async (req, res) => {
  try {
    const captainId = req.user._id;
    const requests = await getTeamJoinRequests(captainId);

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Katılma isteklerini alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "İstekler alınırken bir hata oluştu"
    });
  }
});

// Katılma isteğini yanıtla (Kaptan için)
router.post("/respond-request", authMiddleware, async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: "accept" veya "reject"
    const captainId = req.user._id;

    if (!requestId || !action || !["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Geçerli istek ID'si ve aksiyon gerekli"
      });
    }

    const result = await respondToTeamJoinRequest(requestId, captainId, action);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("İstek yanıtlama hatası:", error);
    res.status(500).json({
      success: false,
      message: "İstek yanıtlanırken bir hata oluştu"
    });
  }
});

// Takımdan ayrıl
router.post("/leave", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await leaveTeam(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Takımdan ayrılma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Takımdan ayrılırken bir hata oluştu"
    });
  }
});

// Turnuva için takım durumunu kontrol et
router.get("/tournament-eligibility/:tournamentId", authMiddleware, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    // Turnuva bilgilerini al
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    const tournament = await database.collection("tournaments")
      .findOne({ _id: new ObjectId(tournamentId) });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Turnuva bulunamadı"
      });
    }

    const teamInfo = await getUserTeamForTournament(userId, tournament.game);

    res.status(200).json({
      success: true,
      teamInfo,
      tournament: {
        title: tournament.title,
        game: tournament.game
      }
    });
  } catch (error) {
    console.error("Takım uygunluk kontrolü hatası:", error);
    res.status(500).json({
      success: false,
      message: "Kontrol sırasında bir hata oluştu"
    });
  }
});

// Takımla turnuvaya kaydol
router.post("/register-tournament/:tournamentId", authMiddleware, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    const result = await registerTeamForTournament(tournamentId, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Takım turnuva kaydı hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuva kaydı sırasında bir hata oluştu"
    });
  }
});


export default router;