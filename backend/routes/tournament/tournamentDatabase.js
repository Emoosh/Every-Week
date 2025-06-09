import { connectDB } from "../../Database/db.js";

// Tournament Database Operations
export class TournamentDatabase {
  
  // Tek okul turnuvası oluştur
  static async createSingleSchoolTournament(tournamentData) {
    try {
      const database = await connectDB();
      
      const tournament = {
        ...tournamentData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "upcoming", // upcoming, ongoing, completed, cancelled
        participants: []
      };

      const result = await database.collection("tournaments").insertOne(tournament);
      console.log("✅ Tournament created with ID:", result.insertedId);

      return { 
        success: true, 
        tournamentId: result.insertedId,
        tournament: { ...tournament, _id: result.insertedId }
      };
    } catch (error) {
      console.error("❌ Single school tournament creation error:", error);
      return { success: false, error: error.message };
    }
  }

  // Çok okullu turnuva oluştur
  static async createMultiSchoolTournament(agentIds, tournamentData) {
    try {
      const database = await connectDB();
      const { ObjectId } = await import("mongodb");
      
      // Agent'ların okul bilgilerini al
      const agents = await database.collection("users")
        .find({ _id: { $in: agentIds.map(id => new ObjectId(id)) } })
        .project({ schoolName: 1, _id: 1 })
        .toArray();

      const schools = [...new Set(agents.map(agent => agent.schoolName))];

      const tournament = {
        ...tournamentData,
        schools: schools,
        collaboratingAgents: agentIds,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "upcoming",
        participants: []
      };

      const result = await database.collection("tournaments").insertOne(tournament);
      console.log("✅ Multi-school tournament created with ID:", result.insertedId);

      return { 
        success: true, 
        tournamentId: result.insertedId,
        tournament: { ...tournament, _id: result.insertedId }
      };
    } catch (error) {
      console.error("❌ Multi school tournament creation error:", error);
      return { success: false, error: error.message };
    }
  }

  // Okul turnuvalarını getir
  static async getSchoolTournaments(schoolName) {
    try {
      const database = await connectDB();
      const tournaments = await database.collection("tournaments")
        .find({ schools: schoolName })
        .sort({ startDate: 1 })
        .toArray();
      
      return tournaments;
    } catch (error) {
      console.error("❌ Get school tournaments error:", error);
      return [];
    }
  }

  // Katılınabilir turnuvaları getir
  static async getAvailableTournaments(schoolName) {
    try {
      const database = await connectDB();
      const now = new Date();
      
      const tournaments = await database.collection("tournaments")
        .find({ 
          schools: schoolName,
          registrationDeadline: { $gt: now },
          status: "upcoming"
        })
        .sort({ startDate: 1 })
        .toArray();
      
      return tournaments;
    } catch (error) {
      console.error("❌ Get available tournaments error:", error);
      return [];
    }
  }

  // Bireysel turnuva kaydı
  static async registerUserForTournament(tournamentId, userId, userSchool, teamName = null, teamMembers = []) {
    try {
      const database = await connectDB();
      const { ObjectId } = await import("mongodb");
      const objectId = new ObjectId(tournamentId);
      
      // Turnuvayı kontrol et
      const tournament = await database.collection("tournaments").findOne({ _id: objectId });
      
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
        tournamentId: objectId,
        userId: userId
      });
      
      if (existingParticipant) {
        return { success: false, message: "Bu turnuvaya zaten kayıt olmuşsunuz" };
      }
      
      // Yeni katılımcı kaydı oluştur
      const participant = {
        tournamentId: objectId,
        userId: userId,
        userSchool: userSchool,
        registeredAt: new Date(),
        teamName: teamName,
        teamMembers: teamMembers && teamMembers.length > 0 ? teamMembers : [userId],
        isTeamRegistration: false
      };
      
      await database.collection("tournament_participants").insertOne(participant);
      
      // Turnuva belgesini güncelle
      await database.collection("tournaments").updateOne(
        { _id: objectId },
        { $addToSet: { participants: userId } }
      );
      
      console.log("✅ User registered for tournament successfully");
      return { success: true, message: "Turnuvaya başarıyla kaydoldunuz" };
    } catch (error) {
      console.error("❌ Tournament registration error:", error);
      return { success: false, error: error.message };
    }
  }

  // **YENİ EKLENEN FONKSİYON: Takımla turnuva kaydı**
  static async registerTeamForTournament(tournamentId, userId) {
    try {
      const database = await connectDB();
      const { ObjectId } = await import("mongodb");
      const objectId = new ObjectId(tournamentId);
      
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
        .findOne({ _id: objectId });
      
      if (!tournament) {
        return { success: false, message: "Turnuva bulunamadı" };
      }
      
      // Oyun türü eşleşiyor mu kontrol et
      if (user.teamInfo.gameType.toLowerCase() !== tournament.game.toLowerCase()) {
        return { success: false, message: "Takımınızın oyun türü bu turnuva ile uyumlu değil" };
      }
      
      // Takım yeterli üye sayısına sahip mi kontrol et
      if (user.teamInfo.members.length < 3) {
        return { success: false, message: "Takımınızda en az 3 kişi olmalı" };
      }
      
      // Takım zaten kayıtlı mı kontrol et
      const existingRegistration = await database.collection("tournament_participants")
        .findOne({
          tournamentId: objectId,
          "teamInfo.teamName": user.teamInfo.teamName,
          userSchool: user.schoolName
        });
      
      if (existingRegistration) {
        return { success: false, message: "Bu takım zaten turnuvaya kayıtlı" };
      }
      
      // Turnuva kayıt süresi kontrolü
      const now = new Date();
      if (tournament.registrationDeadline < now) {
        return { success: false, message: "Turnuva kayıt süresi dolmuştur" };
      }
      
      // Takım kaydını oluştur
      const participant = {
        tournamentId: objectId,
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
        { _id: objectId },
        { $addToSet: { participants: { $each: memberIds } } }
      );
      
      console.log("✅ Team registered for tournament successfully");
      return { success: true, message: "Takım turnuvaya başarıyla kaydedildi" };
    } catch (error) {
      console.error("❌ Register team for tournament error:", error);
      return { success: false, error: error.message };
    }
  }

  // Okul ajanlarını getir
  static async getSchoolAgents(schoolName) {
    try {
      const database = await connectDB();
      
      const agents = await database.collection("users")
        .find({ 
          schoolName: schoolName,
          role: "school_agent"
        })
        .project({ _id: 1, username: 1, e_mail: 1, schoolName: 1 })
        .toArray();
      
      return agents;
    } catch (error) {
      console.error("❌ Get school agents error:", error);
      return [];
    }
  }

  // Turnuva detaylarını getir
  static async getTournamentDetails(tournamentId) {
    try {
      const database = await connectDB();
      const { ObjectId } = await import("mongodb");
      const objectId = new ObjectId(tournamentId);
      
      const tournament = await database.collection("tournaments").findOne({ _id: objectId });
      
      if (!tournament) {
        return { success: false, message: "Turnuva bulunamadı" };
      }

      // Katılımcı detaylarını getir
      const participants = await database.collection("tournament_participants")
        .find({ tournamentId: objectId })
        .toArray();

      // Katılımcı kullanıcı bilgilerini getir
      const userIds = participants.map(p => new ObjectId(p.userId));
      const users = await database.collection("users")
        .find({ _id: { $in: userIds } })
        .project({ _id: 1, username: 1, e_mail: 1, schoolName: 1 })
        .toArray();

      const participantDetails = participants.map(participant => {
        const user = users.find(u => u._id.toString() === participant.userId);
        return {
          ...participant,
          userDetails: user
        };
      });

      return {
        success: true,
        tournament: {
          ...tournament,
          participantDetails,
          registeredCount: participants.length
        }
      };
    } catch (error) {
      console.error("❌ Get tournament details error:", error);
      return { success: false, error: error.message };
    }
  }

  // Kullanıcının kayıtlı olduğu turnuvaları getir
  static async getUserTournaments(userId) {
    try {
      const database = await connectDB();
      
      const userParticipations = await database.collection("tournament_participants")
        .find({ userId: userId })
        .toArray();

      const tournamentIds = userParticipations.map(p => p.tournamentId);
      
      const tournaments = await database.collection("tournaments")
        .find({ _id: { $in: tournamentIds } })
        .sort({ startDate: 1 })
        .toArray();

      // Katılım bilgileri ile birleştir
      const tournamentsWithParticipation = tournaments.map(tournament => {
        const participation = userParticipations.find(p => 
          p.tournamentId.toString() === tournament._id.toString()
        );
        return {
          ...tournament,
          participationInfo: participation
        };
      });

      return tournamentsWithParticipation;
    } catch (error) {
      console.error("❌ Get user tournaments error:", error);
      return [];
    }
  }
}

export default TournamentDatabase;