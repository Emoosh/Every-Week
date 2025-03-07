import express from "express";
import { 
  createTournament, 
  getSchoolTournaments, 
  getAvailableTournaments, 
  registerForTournament,
  createMultiSchoolTournament,
  getSchoolAgents
} from "../../Database/db.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

// Okul yetkilileri için işlemler

// Okul yetkilisi olarak turnuva oluşturma
router.post("/create", authMiddleware, async (req, res) => {
  try {
    // Kullanıcının okul yetkilisi olup olmadığını kontrol et
    if (req.user.role !== "school_agent") {
      return res.status(403).json({
        success: false,
        message: "Bu işlem için okul yetkilisi olmanız gerekir"
      });
    }

    const tournamentData = req.body;
    
    // Temel alan doğrulamaları
    if (!tournamentData.title || !tournamentData.game || !tournamentData.participantLimit ||
        !tournamentData.startDate || !tournamentData.endDate || !tournamentData.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Turnuva için gerekli tüm alanları doldurun"
      });
    }

    // Turnuva verilerine kullanıcı bilgilerini ekle
    tournamentData.createdBy = req.user._id;
    
    // Varsayılan olarak turnuvaya sadece oluşturan kullanıcının okulu katılabilir
    tournamentData.schools = [req.user.schoolName];

    const result = await createTournament(tournamentData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Turnuva oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuva oluşturulurken bir hata oluştu"
    });
  }
});

// Çok okullu turnuva oluşturma
router.post("/create-multi", authMiddleware, async (req, res) => {
  try {
    // Kullanıcının okul yetkilisi olup olmadığını kontrol et
    if (req.user.role !== "school_agent") {
      return res.status(403).json({
        success: false,
        message: "Bu işlem için okul yetkilisi olmanız gerekir"
      });
    }

    const { collaboratingAgents, tournamentData } = req.body;
    
    if (!collaboratingAgents || collaboratingAgents.length < 1) {
      return res.status(400).json({
        success: false,
        message: "En az bir işbirlikçi okul ajanı belirtmelisiniz"
      });
    }
    
    // Temel alan doğrulamaları
    if (!tournamentData.title || !tournamentData.game || !tournamentData.participantLimit ||
        !tournamentData.startDate || !tournamentData.endDate || !tournamentData.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Turnuva için gerekli tüm alanları doldurun"
      });
    }

    // İşbirlikçi ajanları ve mevcut kullanıcıyı içeren bir ajan listesi oluştur
    const agentIds = [req.user._id, ...collaboratingAgents];
    
    const result = await createMultiSchoolTournament(agentIds, tournamentData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Çok okullu turnuva oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuva oluşturulurken bir hata oluştu"
    });
  }
});

// Okul ajanlarını listele
router.get("/agents/:schoolName", authMiddleware, async (req, res) => {
  try {
    const { schoolName } = req.params;
    
    // Sadece okul ajanları ve kendi okullarının ajanlarını görebilir
    if (req.user.role !== "school_agent") {
      return res.status(403).json({
        success: false,
        message: "Bu bilgiye erişim izniniz yok"
      });
    }
    
    const agents = await getSchoolAgents(schoolName);
    
    res.status(200).json({
      success: true,
      agents
    });
  } catch (error) {
    console.error("Okul ajanları listesini alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Okul ajanları listelenirken bir hata oluştu"
    });
  }
});

// Normal kullanıcılar için işlemler

// Kullanıcının kendi okuluna ait turnuvaları listele
router.get("/school/:schoolName", authMiddleware, async (req, res) => {
  try {
    const { schoolName } = req.params;
    
    // Kullanıcı sadece kendi okulunun turnuvalarını görebilir
    if (req.user.schoolName !== schoolName) {
      return res.status(403).json({
        success: false,
        message: "Bu okula ait turnuvaları görüntüleme yetkiniz yok"
      });
    }
    
    const tournaments = await getSchoolTournaments(schoolName);
    
    res.status(200).json({
      success: true,
      tournaments
    });
  } catch (error) {
    console.error("Okul turnuvalarını alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuvalar listelenirken bir hata oluştu"
    });
  }
});

// Kullanıcının katılabileceği tüm turnuvaları listele
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const userSchool = req.user.schoolName;
    
    if (!userSchool) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcının okul bilgisi bulunamadı"
      });
    }
    
    const tournaments = await getAvailableTournaments(userSchool);
    
    res.status(200).json({
      success: true,
      tournaments
    });
  } catch (error) {
    console.error("Katılınabilir turnuvaları alma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuvalar listelenirken bir hata oluştu"
    });
  }
});

// Bir turnuvaya kaydol
router.post("/register/:id", authMiddleware, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user._id;
    const userSchool = req.user.schoolName;
    const { teamName, teamMembers } = req.body;
    
    if (!userSchool) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcının okul bilgisi bulunamadı"
      });
    }
    
    const result = await registerForTournament(tournamentId, userId, userSchool, teamName, teamMembers);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Turnuvaya kayıt hatası:", error);
    res.status(500).json({
      success: false,
      message: "Turnuvaya kaydolurken bir hata oluştu"
    });
  }
});

export default router;