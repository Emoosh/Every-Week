import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

// .env dosyasını yükle
dotenv.config();

const uri = process.env.MONGODB_KEY;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db; 

export async function connectDB() {
  try {
    if (!db) { 
      await client.connect();
      db = client.db("Every-Week");
      console.log("✅ Connected to MongoDB!");
    }
    return db;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

/**
 * Kullanıcı kaydı oluşturur (signup)
 */
export async function signup(e_mail, password, schoolName = null, role = "user") {
  try {
    const database = await connectDB();  

    const newUser = {
      e_mail,
      password,
      schoolName, // User's school
      role, // "user", "schoolAgent"
      createdAt: new Date(),
      lastLogin: null
    };

    const result = await database.collection("users").insertOne(newUser);
    console.log("✅ User created with ID:", result.insertedId);
    return { success: true, userId: result.insertedId };
  } catch (error) {
    console.error("❌ Signup error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcı giriş yapar (login)
 */
export async function login(e_mail, password) {
  try {
    const database = await connectDB();

    const user = await database.collection("users").findOne({ e_mail, password });

    if (!user) {
      console.log("❌ Invalid email or password!");
      return null;
    }

    await database.collection("users").updateOne(
      { e_mail },
      { $set: { lastLogin: new Date() } }
    );

    console.log("✅ Login succeeded:", user.e_mail);
    return user;
  } catch (error) {
    console.error("❌ Login error:", error);
    return null;
  }
}

/**
 * Create a new tournament
 * @param {Object} tournamentData - Turnuva verileri
 * @param {string} tournamentData.title - Turnuva başlığı
 * @param {string} tournamentData.description - Turnuva açıklaması
 * @param {string} tournamentData.game - Oyun adı
 * @param {number} tournamentData.prizePool - Ödül havuzu
 * @param {number} tournamentData.participantLimit - Katılımcı sınırı
 * @param {Date} tournamentData.startDate - Başlangıç tarihi
 * @param {Date} tournamentData.endDate - Bitiş tarihi
 * @param {Date} tournamentData.registrationDeadline - Kayıt son tarihi
 * @param {string} tournamentData.createdBy - Turnuvayı oluşturan okul ajanı ID'si
 * @param {Array<string>} tournamentData.schools - Katılımcı okulların listesi
 */
export async function createTournament(tournamentData) {
  try {
    const database = await connectDB();
    
    const newTournament = {
      title: tournamentData.title,
      description: tournamentData.description,
      game: tournamentData.game,
      prizePool: tournamentData.prizePool,
      participantLimit: tournamentData.participantLimit,
      startDate: new Date(tournamentData.startDate),
      endDate: new Date(tournamentData.endDate),
      registrationDeadline: new Date(tournamentData.registrationDeadline),
      createdBy: tournamentData.createdBy,
      schools: tournamentData.schools || [], // Katılabilecek okulların listesi
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [],
      status: "upcoming" // "upcoming", "ongoing", "completed"
    };
    
    const result = await database.collection("tournaments").insertOne(newTournament);
    console.log("✅ Tournament created with ID:", result.insertedId);
    return { success: true, tournamentId: result.insertedId };
  } catch (error) {
    console.error("❌ Tournament creation error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get tournaments filtered by school
 * @param {string} schoolName - Okul adı
 * @returns {Array} - Okulun turnuvaları
 */
export async function getSchoolTournaments(schoolName) {
  try {
    const database = await connectDB();
    const tournaments = await database.collection("tournaments")
      .find({ schools: schoolName }) // schools dizisinde belirtilen okul adını ara
      .sort({ startDate: 1 }) // Yaklaşan turnuvalar önce gösterilir
      .toArray();
    
    return tournaments;
  } catch (error) {
    console.error("❌ Get tournaments error:", error);
    return [];
  }
}

/**
 * Get all tournaments that a user can participate in
 * @param {string} schoolName - Kullanıcının okul adı 
 * @returns {Array} - Katılabileceği turnuvalar
 */
export async function getAvailableTournaments(schoolName) {
  try {
    const database = await connectDB();
    const now = new Date();
    
    // Okul listesinde kullanıcının okulu bulunan ve kayıt süresi geçmemiş turnuvaları getir
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
    
    // Önce turnuvayı kontrol et
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
      registeredAt: new Date(),
      teamName: teamName,
      teamMembers: teamMembers.includes(userId) ? teamMembers : [userId, ...teamMembers]
    };
    
    await database.collection("tournament_participants").insertOne(participant);
    
    // Turnuva belgesini güncelle
    await database.collection("tournaments").updateOne(
      { _id: tournamentId },
      { $addToSet: { participants: userId } }
    );
    
    return { success: true, message: "Turnuvaya başarıyla kaydoldunuz" };
  } catch (error) {
    console.error("❌ Tournament registration error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set user as school agent
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} schoolName - Okul adı
 */
export async function setUserAsSchoolAgent(userId, schoolName) {
  try {
    const database = await connectDB();
    
    console.log(`🔍 Setting user ${userId} as school agent for ${schoolName}`);
    
    // Kullanıcıyı kontrol et - MongoDB ObjectId olarak çevir
    let user;
    try {
      // userId bir ObjectId mi veya string mi kontrol et
      const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      user = await database.collection("users").findOne({ _id: objectId });
    } catch (error) {
      console.error("❌ Error converting userId to ObjectId:", error);
      return { success: false, message: "Geçersiz kullanıcı ID formatı" };
    }
    
    if (!user) {
      console.log("❌ User not found with ID:", userId);
      return { success: false, message: "Kullanıcı bulunamadı" };
    }
    
    console.log("👤 Found user:", user);
    
    // Kullanıcının okulu ile atanmak istenen okul eşleşiyor mu kontrol et
    // Not: Bu kontrol isteğe bağlı olarak devre dışı bırakılabilir
    if (schoolName && user.schoolName && user.schoolName !== schoolName) {
      console.log(`❌ School mismatch: User's school: ${user.schoolName}, Target school: ${schoolName}`);
      return { success: false, message: "Kullanıcı bu okulun öğrencisi değil" };
    }
    
    // Kullanıcı zaten okul yetkilisi mi kontrol et
    if (user.role === "school_agent") {
      console.log("❌ User is already a school agent");
      return { success: false, message: "Kullanıcı zaten okul yetkilisi" };
    }
    
    // Kullanıcıyı schoolAgent olarak güncelle
    const userUpdateResult = await database.collection("users").updateOne(
      { _id: user._id },
      { $set: { role: "school_agent", schoolName: schoolName || user.schoolName } }
    );
    
    console.log("✏️ User update result:", userUpdateResult);
    
    if (userUpdateResult.modifiedCount === 0 && userUpdateResult.matchedCount === 0) {
      console.log("❌ Failed to update user");
      return { success: false, message: "Kullanıcı güncellenirken bir hata oluştu" };
    }
    
    // Okul ajanları tablosuna ekle
    const schoolAgent = {
      userId: user._id,
      schoolName: schoolName || user.schoolName,
      createdAt: new Date(),
      isActive: true
    };
    
    const agentInsertResult = await database.collection("school_agents").insertOne(schoolAgent);
    console.log("✅ Agent insert result:", agentInsertResult);
    
    return { 
      success: true, 
      message: "Kullanıcı başarıyla okul yetkilisi olarak atandı",
      user: {
        _id: user._id,
        email: user.e_mail || user.mail || user.email,
        schoolName: schoolName || user.schoolName,
        role: "school_agent"
      }
    };
  } catch (error) {
    console.error("❌ Set school agent error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get school agents by school name
 * @param {string} schoolName - Okul adı
 * @returns {Array} - Okul ajanları listesi
 */
export async function getSchoolAgents(schoolName) {
  try {
    const database = await connectDB();
    
    // Query directly from users collection with role-based filtering
    const query = schoolName 
      ? { role: "school_agent", schoolName: schoolName }
      : { role: "school_agent" };
    
    const schoolAgents = await database.collection("users")
      .find(query)
      .project({
        _id: 1,
        e_mail: 1,
        schoolName: 1,
        username: 1,
        createdAt: 1
      })
      .toArray();
    
    return schoolAgents;
  } catch (error) {
    console.error("❌ Get school agents error:", error);
    return [];
  }
}

/**
 * Get all students
 * @param {string} schoolName - Okul adı (optional filter by school)
 * @returns {Array} - Öğrenci listesi
 */
export async function getStudents(schoolName = null) {
  try {
    const database = await connectDB();
    
    // Log current status for debugging
    console.log("👨‍🎓 Fetching students with schoolName:", schoolName || "ALL");
    
    // Create a query that:
    // 1. Excludes users with role "admin" or "school_agent"
    // 2. Optionally filters by schoolName if provided
    let query = {
      $or: [
        { role: { $eq: "user" } },      // Specifically role="user"
        { role: { $exists: false } },   // Role field doesn't exist
        { role: null }                  // Role is null
      ]
    };
    
    // Add school filter if provided
    if (schoolName) {
      query.schoolName = schoolName;
    }
    
    console.log("📋 Query for students:", JSON.stringify(query));
    
    const students = await database.collection("users")
      .find(query)
      .project({
        _id: 1,
        e_mail: 1,
        mail: 1,             // Also include mail field for backward compatibility
        schoolName: 1,
        username: 1,
        name: 1,             // Include name field if used instead of username
        createdAt: 1,
        role: 1              // Include role for debugging
      })
      .toArray();
    
    console.log(`✅ Found ${students.length} students`);
    
    // Transform data to ensure consistent field names
    const standardizedStudents = students.map(student => ({
      _id: student._id,
      e_mail: student.e_mail || student.mail || student.email,
      schoolName: student.schoolName,
      username: student.username || student.name,
      createdAt: student.createdAt,
      role: student.role || "user"
    }));
    
    return standardizedStudents;
  } catch (error) {
    console.error("❌ Get students error:", error);
    return [];
  }
}

/**
 * Create a multi-school tournament
 * @param {Array} agentIds - Turnuva oluşturan okul ajanlarının ID'leri
 * @param {Object} tournamentData - Turnuva verileri
 */
export async function createMultiSchoolTournament(agentIds, tournamentData) {
  try {
    const database = await connectDB();
    
    // Ajanları ve okulları kontrol et
    const agents = await database.collection("school_agents")
      .find({ userId: { $in: agentIds }, isActive: true })
      .toArray();
    
    if (agents.length !== agentIds.length) {
      return { success: false, message: "Bir veya daha fazla ajan bulunamadı veya aktif değil" };
    }
    
    // Katılabilecek okulların listesini oluştur
    const schools = agents.map(agent => agent.schoolName);
    
    // Turnuvayı oluştur
    const newTournament = {
      title: tournamentData.title,
      description: tournamentData.description,
      game: tournamentData.game,
      prizePool: tournamentData.prizePool,
      participantLimit: tournamentData.participantLimit,
      startDate: new Date(tournamentData.startDate),
      endDate: new Date(tournamentData.endDate),
      registrationDeadline: new Date(tournamentData.registrationDeadline),
      createdBy: agentIds, // Birden fazla ajan tarafından oluşturuldu
      schools: schools, // Katılabilecek okulların listesi
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [],
      status: "upcoming" // "upcoming", "ongoing", "completed"
    };
    
    const result = await database.collection("tournaments").insertOne(newTournament);
    console.log("✅ Multi-school tournament created with ID:", result.insertedId);
    
    return { 
      success: true, 
      tournamentId: result.insertedId,
      schools: schools
    };
  } catch (error) {
    console.error("❌ Multi-school tournament creation error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının oyun hesaplarını kaydet
 * @param {string} userId - Kullanıcı ID'si
 * @param {Object} gameAccounts - Oyun hesapları
 * @param {Object} gameAccounts.league - League of Legends hesap bilgileri
 * @param {string} gameAccounts.league.gameName - Oyun içi kullanıcı adı
 * @param {string} gameAccounts.league.tagLine - Riot tag'i (#TR1, #EUW, vb.)
 * @param {Object} gameAccounts.valorant - Valorant hesap bilgileri
 * @param {string} gameAccounts.valorant.gameName - Oyun içi kullanıcı adı
 * @param {string} gameAccounts.valorant.tagLine - Riot tag'i
 */
export async function saveGameAccounts(userId, gameAccounts) {
  try {
    const database = await connectDB();
    
    // Önce mevcut kayıt var mı kontrol et
    const existingAccount = await database.collection("game_accounts").findOne({ userId });
    
    if (existingAccount) {
      // Güncelle
      const result = await database.collection("game_accounts").updateOne(
        { userId },
        { $set: {
          ...gameAccounts,
          updatedAt: new Date()
        }}
      );
      
      console.log("✅ Game accounts updated:", result.modifiedCount);
      return { success: true, message: "Oyun hesapları güncellendi" };
    } else {
      // Yeni kayıt oluştur
      const newGameAccount = {
        userId,
        ...gameAccounts,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await database.collection("game_accounts").insertOne(newGameAccount);
      console.log("✅ Game accounts created with ID:", result.insertedId);
      return { success: true, message: "Oyun hesapları kaydedildi" };
    }
  } catch (error) {
    console.error("❌ Save game accounts error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının oyun hesaplarını getir
 * @param {string} userId - Kullanıcı ID'si
 */
export async function getGameAccounts(userId) {
  try {
    const database = await connectDB();
    
    const gameAccounts = await database.collection("game_accounts").findOne({ userId });
    return gameAccounts;
  } catch (error) {
    console.error("❌ Get game accounts error:", error);
    return null;
  }
}

/**
 * Kullanıcının son oyun verilerini kaydet
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} gameType - Oyun türü ('league', 'valorant', vb.)
 * @param {Object} matchData - Maç verileri
 */
export async function saveGameMatchData(userId, gameType, matchData) {
  try {
    const database = await connectDB();
    
    const newMatchData = {
      userId,
      gameType,
      matchData,
      createdAt: new Date()
    };
    
    const result = await database.collection("game_match_history").insertOne(newMatchData);
    console.log(`✅ ${gameType} match data saved with ID:`, result.insertedId);
    return { success: true, matchId: result.insertedId };
  } catch (error) {
    console.error(`❌ Save ${gameType} match data error:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının son oyun verilerini getir
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} gameType - Oyun türü ('league', 'valorant', vb.)
 * @param {number} limit - Kaç maç getirileceği
 */
export async function getGameMatchHistory(userId, gameType, limit = 10) {
  try {
    const database = await connectDB();
    
    const query = { userId };
    if (gameType) {
      query.gameType = gameType;
    }
    
    const matches = await database.collection("game_match_history")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
      
    return matches;
  } catch (error) {
    console.error("❌ Get game match history error:", error);
    return [];
  }
}

/**
 * Kullanıcının herkese açık profil bilgilerini getir
 * @param {string} userId - Kullanıcı ID'si
 */
export async function getPublicUserProfile(userId) {
  try {
    const database = await connectDB();
    
    // Kullanıcı bilgilerini al
    const user = await database.collection("users").findOne(
      { _id: userId },
      { projection: { password: 0 } } // Şifreyi dahil etme
    );
    
    if (!user) {
      return null;
    }
    
    // Oyun hesaplarını al
    const gameAccounts = await database.collection("game_accounts").findOne({ userId });
    
    // Oyun istatistiklerini al
    const lolInfo = await database.collection("Lol-informations").findOne({ userId });
    
    // Son maçları al (league ve valorant)
    const recentMatches = {
      league: [],
      valorant: []
    };
    
    // League of Legends maçları
    const leagueMatches = await database.collection("game_match_history")
      .find({ userId, gameType: "league" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (leagueMatches && leagueMatches.length > 0) {
      recentMatches.league = leagueMatches;
    }
    
    // Valorant maçları
    const valorantMatches = await database.collection("game_match_history")
      .find({ userId, gameType: "valorant" })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (valorantMatches && valorantMatches.length > 0) {
      recentMatches.valorant = valorantMatches;
    }
    
    // Tüm bilgileri birleştir
    return {
      user: {
        _id: user._id,
        username: user.username || "",
        schoolName: user.schoolName || "",
        e_mail: user.e_mail || user.mail || "",
        role: user.role || "user"
      },
      gameAccounts: gameAccounts || { league: null, valorant: null },
      riotInfo: lolInfo || null,
      recentMatches
    };
    
  } catch (error) {
    console.error("❌ Get public user profile error:", error);
    return null;
  }
}

/**
 * Kullanıcının oyun istatistiklerini güncelle/kaydet (Riot API'den)
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} gameType - Oyun türü ('league', 'valorant')
 * @param {Object} statsData - Oyun istatistikleri
 */
export async function saveGameStats(userId, gameType, statsData) {
  try {
    const database = await connectDB();
    
    // Stats collection belirle
    const collectionName = gameType === 'league' ? 'Lol-informations' : 'valorant-informations';
    
    const result = await database.collection(collectionName).updateOne(
      { userId },
      { 
        $set: {
          ...statsData,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    return { success: true, message: `${gameType} stats updated successfully` };
  } catch (error) {
    console.error(`❌ Save ${gameType} stats error:`, error);
    return { success: false, error: error.message };
  }
}

//Emojiler aşşşırı komik
process.on("SIGINT", async () => {
  console.log("🔌 Closing MongoDB connection...");
  await client.close();
  process.exit(0);
});
