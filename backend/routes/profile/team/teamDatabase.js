import { connectDB } from "../../../Database/db.js";

/**
 * Kullanıcının takım bilgilerini getir
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Object|null} - Kullanıcının takım bilgileri
 */
export async function getUserTeam(userId) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    const user = await database.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { teamInfo: 1, _id: 1, username: 1, e_mail: 1, schoolName: 1 } }
    );
    
    return user?.teamInfo || null;
  } catch (error) {
    console.error("❌ Get user team error:", error);
    return null;
  }
}

/**
 * Takım oluştur (kullanıcı profilinde)
 * @param {string} captainId - Takım kaptanı ID'si
 * @param {string} teamName - Takım adı
 * @param {string} gameType - Oyun türü
 * @param {string} schoolName - Okul adı
 * @param {number} maxMembers - Maksimum üye sayısı (varsayılan 5)
 * @returns {Object} - İşlem sonucu
 */
export async function createTeamNew(captainId, teamName, gameType, schoolName, maxMembers = 5) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    // Takım adı kontrolü (aynı okul içinde)
    const existingTeam = await database.collection("users").findOne({ 
      "teamInfo.teamName": teamName,
      schoolName: schoolName,
      "teamInfo.isActive": true
    });
    
    if (existingTeam) {
      return { success: false, message: "Bu takım adı bu okulda zaten kullanılıyor" };
    }
    
    // Kullanıcının zaten aktif takımı var mı kontrol et
    const user = await database.collection("users").findOne({ _id: new ObjectId(captainId) });
    if (user?.teamInfo?.isActive) {
      return { success: false, message: "Zaten aktif bir takımınız var" };
    }
    
    const teamInfo = {
      teamName,
      role: "captain", // captain, member
      gameType,
      maxMembers,
      members: [
        {
          userId: captainId,
          username: user.username || user.e_mail,
          role: "captain",
          joinedAt: new Date()
        }
      ],
      isLookingForMembers: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Kullanıcının takım bilgilerini güncelle
    const result = await database.collection("users").updateOne(
      { _id: new ObjectId(captainId) },
      { $set: { teamInfo } }
    );
    
    console.log("✅ Team created successfully");
    return { success: true, teamInfo };
  } catch (error) {
    console.error("❌ Create team error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Üye arayan takımları listele
 * @param {string} gameType - Oyun türü
 * @param {string} schoolName - Okul adı (opsiyonel)
 * @returns {Array} - Üye arayan takımlar
 */
export async function getTeamsLookingForMembers(gameType, schoolName = null) {
  try {
    const database = await connectDB();
    
    const query = {
      "teamInfo.gameType": gameType,
      "teamInfo.isLookingForMembers": true,
      "teamInfo.isActive": true,
      "teamInfo.role": "captain", // Sadece kaptanların kayıtlarını getir
      $expr: { 
        $lt: [
          { $size: "$teamInfo.members" }, 
          "$teamInfo.maxMembers"
        ] 
      }
    };
    
    if (schoolName) {
      query.schoolName = schoolName;
    }
    
    const teams = await database.collection("users")
      .find(query)
      .project({
        _id: 1,
        username: 1,
        e_mail: 1,
        schoolName: 1,
        teamInfo: 1
      })
      .sort({ "teamInfo.createdAt": -1 })
      .toArray();
    
    // Takım bilgilerini düzenle
    const formattedTeams = teams.map(team => ({
      captainId: team._id,
      captainUsername: team.username || team.e_mail,
      schoolName: team.schoolName,
      teamName: team.teamInfo.teamName,
      gameType: team.teamInfo.gameType,
      members: team.teamInfo.members,
      availableSlots: team.teamInfo.maxMembers - team.teamInfo.members.length,
      maxMembers: team.teamInfo.maxMembers,
      createdAt: team.teamInfo.createdAt
    }));
    
    return formattedTeams;
  } catch (error) {
    console.error("❌ Get teams looking for members error:", error);
    return [];
  }
}

/**
 * Takıma katılma isteği gönder
 * @param {string} userId - İstek gönderen kullanıcı ID'si
 * @param {string} captainId - Takım kaptanı ID'si
 * @param {string} message - İsteğe eklenecek mesaj (opsiyonel)
 * @returns {Object} - İşlem sonucu
 */
export async function sendTeamJoinRequest(userId, captainId, message = "") {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    // Kullanıcının zaten takımı var mı kontrol et
    const user = await database.collection("users").findOne({ _id: new ObjectId(userId) });
    if (user?.teamInfo?.isActive) {
      return { success: false, message: "Zaten aktif bir takımınız var" };
    }
    
    // Kaptanı ve takımı kontrol et
    const captain = await database.collection("users").findOne({ 
      _id: new ObjectId(captainId),
      "teamInfo.role": "captain",
      "teamInfo.isActive": true
    });
    
    if (!captain || !captain.teamInfo) {
      return { success: false, message: "Takım bulunamadı" };
    }
    
    // Takım dolu mu kontrol et
    if (captain.teamInfo.members.length >= captain.teamInfo.maxMembers) {
      return { success: false, message: "Takım dolu" };
    }
    
    // Daha önce istek gönderilmiş mi kontrol et
    const existingRequest = await database.collection("team_join_requests").findOne({
      userId,
      captainId,
      status: "pending"
    });
    
    if (existingRequest) {
      return { success: false, message: "Bu takıma zaten bir katılma isteği gönderilmiş" };
    }
    
    // Yeni istek oluştur
    const joinRequest = {
      userId,
      captainId,
      teamName: captain.teamInfo.teamName,
      gameType: captain.teamInfo.gameType,
      message,
      status: "pending", // pending, accepted, rejected
      createdAt: new Date()
    };
    
    const result = await database.collection("team_join_requests").insertOne(joinRequest);
    console.log("✅ Team join request sent with ID:", result.insertedId);
    
    return { success: true, requestId: result.insertedId };
  } catch (error) {
    console.error("❌ Send team join request error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Takım katılma isteklerini getir (takım kaptanı için)
 * @param {string} captainId - Takım kaptanı ID'si
 * @returns {Array} - Bekleyen istekler
 */
export async function getTeamJoinRequests(captainId) {
  try {
    const database = await connectDB();
    
    // Takıma gelen istekleri getir
    const requests = await database.collection("team_join_requests")
      .find({ captainId, status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();
    
    // İstek sahiplerinin detaylarını getir
    const requestsWithUserDetails = await Promise.all(
      requests.map(async (request) => {
        const { ObjectId } = await import("mongodb");
        const user = await database.collection("users")
          .findOne(
            { _id: new ObjectId(request.userId) },
            { projection: { _id: 1, username: 1, e_mail: 1, schoolName: 1 } }
          );
        
        return {
          ...request,
          userDetails: user
        };
      })
    );
    
    return requestsWithUserDetails;
  } catch (error) {
    console.error("❌ Get team join requests error:", error);
    return [];
  }
}

/**
 * Takım katılma isteğini yanıtla
 * @param {string} requestId - İstek ID'si
 * @param {string} captainId - Takım kaptanı ID'si
 * @param {string} action - "accept" veya "reject"
 * @returns {Object} - İşlem sonucu
 */
export async function respondToTeamJoinRequest(requestId, captainId, action) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    // İsteği kontrol et
    const request = await database.collection("team_join_requests")
      .findOne({ _id: new ObjectId(requestId), captainId, status: "pending" });
    
    if (!request) {
      return { success: false, message: "İstek bulunamadı veya zaten yanıtlanmış" };
    }
    
    // Kaptanın takımını kontrol et
    const captain = await database.collection("users").findOne({ 
      _id: new ObjectId(captainId),
      "teamInfo.role": "captain",
      "teamInfo.isActive": true
    });
    
    if (!captain || !captain.teamInfo) {
      return { success: false, message: "Takım bulunamadı veya yetkiniz yok" };
    }
    
    // İsteği güncelle
    await database.collection("team_join_requests").updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: action === "accept" ? "accepted" : "rejected",
          respondedAt: new Date()
        }
      }
    );
    
    if (action === "accept") {
      // Takım dolu mu kontrol et
      if (captain.teamInfo.members.length >= captain.teamInfo.maxMembers) {
        return { success: false, message: "Takım dolu" };
      }
      
      // Kullanıcının hala takımı yok mu kontrol et
      const user = await database.collection("users").findOne({ _id: new ObjectId(request.userId) });
      if (user?.teamInfo?.isActive) {
        return { success: false, message: "Kullanıcı artık başka bir takımda" };
      }
      
      // Yeni üye bilgisi
      const newMember = {
        userId: request.userId,
        username: user.username || user.e_mail,
        role: "member",
        joinedAt: new Date()
      };
      
      // Kaptanın takımına üye ekle
      await database.collection("users").updateOne(
        { _id: new ObjectId(captainId) },
        { 
          $push: { "teamInfo.members": newMember },
          $set: { 
            "teamInfo.updatedAt": new Date(),
            "teamInfo.isLookingForMembers": captain.teamInfo.members.length + 1 < captain.teamInfo.maxMembers
          }
        }
      );
      
      // Kullanıcıya takım bilgilerini ekle
      const memberTeamInfo = {
        ...captain.teamInfo,
        role: "member",
        joinedAt: new Date()
      };
      
      await database.collection("users").updateOne(
        { _id: new ObjectId(request.userId) },
        { $set: { teamInfo: memberTeamInfo } }
      );
      
      console.log("✅ User added to team successfully");
    }
    
    return { 
      success: true, 
      message: action === "accept" ? "Kullanıcı takıma eklendi" : "İstek reddedildi"
    };
  } catch (error) {
    console.error("❌ Respond to team join request error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Turnuva için kullanıcının takımını getir
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} gameType - Oyun türü
 * @returns {Object|null} - Takım bilgileri
 */
export async function getUserTeamForTournament(userId, gameType) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    const user = await database.collection("users").findOne({ 
      _id: new ObjectId(userId),
      "teamInfo.gameType": gameType,
      "teamInfo.isActive": true
    });
    
    if (!user?.teamInfo) {
      return null;
    }
    
    // Takım yeterli üye sayısına sahip mi kontrol et (en az 3 kişi)
    if (user.teamInfo.members.length < 3) {
      return { ...user.teamInfo, isEligible: false, reason: "Takımda en az 3 kişi olmalı" };
    }
    
    return { ...user.teamInfo, isEligible: true };
  } catch (error) {
    console.error("❌ Get user team for tournament error:", error);
    return null;
  }
}

/**
 * Takımla turnuvaya kaydol
 * @param {string} tournamentId - Turnuva ID'si
 * @param {string} userId - Kayıt yapan kullanıcı ID'si
 * @returns {Object} - İşlem sonucu
 */
export async function registerTeamForTournament(tournamentId, userId) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    // Kullanıcının takımını kontrol et
    const user = await database.collection("users").findOne({ 
      _id: new ObjectId(userId),
      "teamInfo.isActive": true
    });
    
    if (!user?.teamInfo) {
      return { success: false, message: "Aktif takımınız bulunamadı" };
    }
    
    // Turnuvayı kontrol et
    const tournament = await database.collection("tournaments")
      .findOne({ _id: new ObjectId(tournamentId) });
    
    if (!tournament) {
      return { success: false, message: "Turnuva bulunamadı" };
    }
    
    // Oyun türü eşleşiyor mu kontrol et
    if (user.teamInfo.gameType.toLowerCase() !== tournament.game.toLowerCase()) {
      return { success: false, message: "Takımınızın oyun türü bu turnuva ile uyumlu değil" };
    }
    
    // Takım zaten kayıtlı mı kontrol et
    const existingRegistration = await database.collection("tournament_participants")
      .findOne({
        tournamentId: new ObjectId(tournamentId),
        "teamInfo.teamName": user.teamInfo.teamName,
        userSchool: user.schoolName
      });
    
    if (existingRegistration) {
      return { success: false, message: "Bu takım zaten turnuvaya kayıtlı" };
    }
    
    // Takım kaydını oluştur
    const participant = {
      tournamentId: new ObjectId(tournamentId),
      userId: userId,
      userSchool: user.schoolName,
      teamInfo: user.teamInfo,
      registeredBy: userId,
      registeredAt: new Date(),
      isTeamRegistration: true
    };
    
    await database.collection("tournament_participants").insertOne(participant);
    
    // Turnuva katılımcılarını güncelle (takım üyelerinin userId'lerini ekle)
    const memberIds = user.teamInfo.members.map(member => member.userId);
    await database.collection("tournaments").updateOne(
      { _id: new ObjectId(tournamentId) },
      { $addToSet: { participants: { $each: memberIds } } }
    );
    
    console.log("✅ Team registered for tournament successfully");
    return { success: true, message: "Takım turnuvaya başarıyla kaydedildi" };
  } catch (error) {
    console.error("❌ Register team for tournament error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Takımdan ayrıl
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Object} - İşlem sonucu
 */
export async function leaveTeam(userId) {
  try {
    const database = await connectDB();
    const { ObjectId } = await import("mongodb");
    
    const user = await database.collection("users").findOne({ _id: new ObjectId(userId) });
    
    if (!user?.teamInfo?.isActive) {
      return { success: false, message: "Aktif takımınız bulunmuyor" };
    }
    
    if (user.teamInfo.role === "captain") {
      // Kaptan ise takımı dağıt
      const memberIds = user.teamInfo.members
        .filter(member => member.userId !== userId)
        .map(member => member.userId);
      
      // Diğer üyelerin takım bilgilerini sil
      await database.collection("users").updateMany(
        { _id: { $in: memberIds.map(id => new ObjectId(id)) } },
        { $unset: { teamInfo: "" } }
      );
      
      // Kaptanın takım bilgilerini sil
      await database.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $unset: { teamInfo: "" } }
      );
      
      return { success: true, message: "Takım dağıtıldı" };
    } else {
      // Üye ise sadece takımdan ayrıl
      // Önce kaptanı bul ve takımdan çıkar
      const captain = await database.collection("users").findOne({
        "teamInfo.teamName": user.teamInfo.teamName,
        "teamInfo.role": "captain",
        schoolName: user.schoolName
      });
      
      if (captain) {
        // Kaptanın takımından üyeyi çıkar
        await database.collection("users").updateOne(
          { _id: captain._id },
          { 
            $pull: { "teamInfo.members": { userId: userId } },
            $set: { "teamInfo.updatedAt": new Date() }
          }
        );
      }
      
      // Kullanıcının takım bilgilerini sil
      await database.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $unset: { teamInfo: "" } }
      );
      
      return { success: true, message: "Takımdan ayrıldınız" };
    }
  } catch (error) {
    console.error("❌ Leave team error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Register user for a tournament
 * @param {string} tournamentId - Turnuva ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} userSchool - Kullanıcının okulu
 * @param {string} teamName - Takım adı (opsiyonel)
 * @param {Array} teamMembers - Takım üyeleri (opsiyonel)
 */
export async function registerForTournament(tournamentId, userId, userSchool, teamName = null, teamMembers = []) {
  try {
    const database = await connectDB();
    
    // Önce turnuvayı kontrol et - tournamentId zaten ObjectId olmalı
    const tournament = await database.collection("tournaments").findOne({ _id: tournamentId });
    
    if (!tournament) {
      return { success: false, message: "Turnuva bulunamadı" };
    }
    
    // Kullanıcının okulu turnuvaya katılabilir mi kontrol et
    if (!tournament.schools.includes(userSchool)) {
      return { success: false, message: "Bu turnuvaya yalnızca belirli okulların öğrencileri katılabilir" };
    }
    
    // Turnuva kayıt süresi kontrolü
    const now = new Date();
    if (tournament.registrationDeadline < now) {
      return { success: false, message: "Turnuva kayıt süresi dolmuştur" };
    }
    
    // Katılımcı sınırı kontrolü
    if (tournament.participants.length >= tournament.participantLimit) {
      return { success: false, message: "Turnuva katılımcı sınırına ulaşılmıştır" };
    }
    
    // Kullanıcı daha önce kayıt olmuş mu kontrol et
    const existingParticipant = await database.collection("tournament_participants").findOne({
      tournamentId: tournamentId,
      userId: userId
    });
    
    if (existingParticipant) {
      return { success: false, message: "Bu turnuvaya zaten kayıt olmuşsunuz" };
    }
    
    // Yeni katılımcı kaydı oluştur
    const participant = {
      tournamentId: tournamentId,
      userId: userId,
      userSchool: userSchool,
      registeredAt: new Date(),
      teamName: teamName,
      teamMembers: teamMembers && teamMembers.length > 0 ? teamMembers : [userId]
    };

    if(participant.teamMembers.length < 5) {

    }
    
    await database.collection("tournament_participants").insertOne(participant);
    
    // Turnuva belgesini güncelle
    await database.collection("tournaments").updateOne(
      { _id: tournamentId },
      { $addToSet: { participants: userId } }
    );
    
    console.log("✅ User registered for tournament successfully");
    return { success: true, message: "Turnuvaya başarıyla kaydoldunuz" };
  } catch (error) {
    console.error("❌ Tournament registration error:", error);
    return { success: false, error: error.message };
  }
}