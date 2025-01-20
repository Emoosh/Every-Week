import express from "express";
import nodemailer from "nodemailer";
import { getFromSteam } from "./profile_information_providers/steam_informations.js";
// import { getFromTrackerGG } from "./profile_information_providers/trackergg_informations.js";

const router = express.Router();

// ----------------------------------------------------------------------------
// 1) Nodemailer transport tanımı
// ----------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "emihran.dev@gmail.com",  // Kendi Gmail adresiniz
    pass: "12092003EeEe!?",       // App Password veya şifreniz
  },
});

// ----------------------------------------------------------------------------
// 2) OTP oluşturma fonksiyonu
// ----------------------------------------------------------------------------
function generateRandomOTP(length = 6) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

// ----------------------------------------------------------------------------
// 3) Routelar
// ----------------------------------------------------------------------------

// Basit test endpoint'i
router.get("/", (req, res) => {
  res.send("Profile");
});

/**
 * /setUser
 * 
 * - İstek body’sinden steamId, gameName, platform, email değerlerini alır
 * - Geçerlilik kontrolü sonrası session’a kullanıcı bilgilerini kaydeder
 * - Rastgele üretilen bir OTP kodunu mail ile kullanıcıya gönderir
 */
router.post("/setUser", async (req, res) => {
  try {
    const { steamId, gameName, platform, email } = req.body;

    console.log(req.body);

    if (!steamId || !gameName || !platform || !email) {
      return res.status(400).json({
        error: "Please enter steamID, gameName, platform and email.",
      });
    }

    // Session'a kullanıcı bilgilerini kaydet
    req.session.user = { steamId, gameName, platform, email };

    // OTP oluştur
    const otp = generateRandomOTP(6);
    req.session.user.otp = otp;



    // Mail gönder
    await transporter.sendMail(mailOptions);

    return res.json({
      message: "User information is successfully updated, and OTP code sent to email.",
    });
  } catch (error) {
    console.error("Error while sending OTP email:", error);
    return res.status(500).json({
      error: "An error occurred while sending OTP. Please try again.",
    });
  }
});

/**
 * /verifyOTP
 * 
 * - İstek body’sinden userOTP değerini alır
 * - Session'daki OTP değeri ile karşılaştırır
 * - Eşleşiyorsa doğrulama başarılı, değilse hata döndürür
 */
router.post("/verifyOTP", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: "No session data found. Please set user first (call /setUser).",
    });
  }

  const { userOTP } = req.body;
  const serverOTP = req.session.user.otp;

  if (!userOTP) {
    return res.status(400).json({ error: "Please provide an OTP code." });
  }

  if (!serverOTP) {
    return res.status(404).json({
      error: "No OTP found in session. Please call /setUser again to generate a new one.",
    });
  }

  if (userOTP === serverOTP) {
    // OTP doğrulandı. Burada kullanıcıyı veritabanında “onaylı” yapabilirsiniz.
    return res.json({ message: "OTP verified successfully." });
  } else {
    return res.status(401).json({ error: "Invalid OTP code." });
  }
});

/**
 * /getSessionInfo
 * 
 * - Session'da user bilgileri var mı diye bakar
 * - Varsa döndürür, yoksa hata verir
 */
router.get("/getSessionInfo", (req, res) => {
  if (!req.session.user) {
    return res
      .status(401)
      .json({ error: "No session data found. Please login first." });
  }

  res.json({
    message: "Session data retrieved successfully!",
    sessionData: req.session.user,
  });
});

/**
 * /details
 * 
 * - Session’daki kullanıcı bilgisinden steamId alır
 * - query parametresinden gameName, platform değerlerini alır
 * - getFromSteam ve getFromTrackerGG (açarsan) ile verileri çekip döndürür
 */
router.get("/details", async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession || !userSession.steamId) {
      return res.status(401).json({ error: "Error with user session!" });
    }

    const steamId = userSession.steamId;
    const { gameName, platform } = req.query;

    if (!gameName || !platform) {
      return res
        .status(400)
        .json({ error: "gameName and platform are required!" });
    }

    // Eğer getFromTrackerGG'yi aktif kullanmak isterseniz, import satırını açmalısınız.
    const [steamData/*, trackerData*/] = await Promise.all([
      getFromSteam(steamId),
      // getFromTrackerGG(gameName, platform),
    ]);

    // İster trackerData'yı da ekleyin
    // const combinedData = { steam: steamData, tracker: trackerData };
    const combinedData = { steam: steamData }; // Şimdilik sadece Steam verisi

    res.json(combinedData);
  } catch (error) {
    console.error("Error occurred during providing profile informations!", error);
    res
      .status(500)
      .json({ error: "Error occurred during the providing profile informations!" });
  }
});

export default router;
