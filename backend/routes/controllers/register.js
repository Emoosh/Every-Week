import express from "express";
import otpController from "./otpController.js";
import sendMail from "./emailService.js";
import argon2 from "argon2";
import { connectDB } from "../../Database/db.js"; // ✅ MongoDB bağlantısı için

const router = express.Router();
const MAX_OTP_DURATION = 30; // OTP geçerlilik süresi (saniye cinsinden)

router.post("/", async (req, res) => {
  try {
    const { mail, password, username, schoolName } = req.body;

    if (!mail || !password) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve şifre zorunludur.",
      });
    }
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı adı zorunludur.",
      });
    }

    if (!schoolName) {
      return res.status(400).json({
        success: false,
        message: "Okul bilgisi zorunludur.",
      });
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");
    const pendingUsersCollection = db.collection("pendingUsers");

    // Kullanıcının zaten kayıtlı olup olmadığını kontrol et
    //Because of the development reasons this is commented.
/*     const existingUser = await usersCollection.findOne({ mail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu e-posta adresi zaten kayıtlıdır.",
      });
    } */

    // Bekleyen kullanıcı kontrolü
    const existingPendingUser = await pendingUsersCollection.findOne({ mail });
    if (existingPendingUser) {
      return res.status(409).json({
        success: false,
        message: "Bu e-posta adresi için zaten bir kayıt işlemi devam etmektedir.",
      });
    }

    // OTP oluştur ve e-posta gönder
    const { token } = await otpController.requestOTP(mail);

    console.log(token);

    await sendMail(mail, "Doğrulama Kodu", `Kaydolmak için doğrulama kodunuz: ${token}`);

    // Bekleyen kullanıcı olarak veritabanına kaydet
    await pendingUsersCollection.insertOne({
      mail,
      username,
      password,
      schoolName,
      otp: token,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "OTP kodu mail adresinize gönderilmiştir.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/requestOTP", async (req, res) => {
  try {
    const { mail } = req.body;

    if (!mail) {
      return res.status(400).json({
        success: false,
        message: "E-posta adresi zorunludur.",
      });
    }

    const db = await connectDB();
    const pendingUsersCollection = db.collection("pendingUsers");

    const pendingUser = await pendingUsersCollection.findOne({ mail });
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    const { token } = await otpController.requestOTP(mail);
    await pendingUsersCollection.updateOne(
      { mail },
      { $set: { otp: String(token), updatedAt: new Date() } }
    );

    await sendMail(mail, "Yeni Doğrulama Kodu", `Yeni doğrulama kodunuz: ${token}`);

    return res.status(200).json({
      success: true,
      message: "Yeni OTP başarıyla gönderildi.",
    });
  } catch (error) {
    console.error("Yeni OTP gönderme hatası:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/verifyOTP", async (req, res) => {
  try {
    const { mail, token } = req.body;

    if (!mail || !token) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve OTP kodu zorunludur.",
      });
    }

    const db = await connectDB();
    const pendingUsersCollection = db.collection("pendingUsers");
    const usersCollection = db.collection("users");

    const pendingUser = await pendingUsersCollection.findOne({ mail });
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    // OTP süresi dolduysa kaydı sil
    const createdAt = new Date(pendingUser.createdAt);
    const timeElapsed = Math.floor((Date.now() - createdAt.getTime()) / 1000);

    if (timeElapsed > MAX_OTP_DURATION) {
      await pendingUsersCollection.deleteOne({ mail });
      return res.status(400).json({
        success: false,
        message: "OTP kodunun süresi dolmuş. Yeni bir kod talep edin.",
      });
    }

    if (pendingUser.otp !== token) {
      return res.status(400).json({
        success: false,
        message: "OTP kodu geçersiz veya süresi dolmuş.",
      });
    }

    // Şifreyi hashle
    const hashedPassword = await argon2.hash(String(pendingUser.password));

    // Kullanıcıyı kaydet ve pendingUsers'tan sil
    await usersCollection.insertOne({
      mail,
      username: pendingUser.username,
      password: hashedPassword,
      schoolName: pendingUser.schoolName,
      createdAt: new Date(),
    });

    await pendingUsersCollection.deleteOne({ mail });

    return res.status(200).json({
      success: true,
      message: "Kayıt tamamlandı ve kullanıcı doğrulandı.",
    });
  } catch (error) {
    console.error("OTP doğrulama hatası:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
