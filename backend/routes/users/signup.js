import express from "express";
import otpController from "./otpController.js";
import sendMail from "./emailService.js";
import argon2 from "argon2";
import { db } from "../../firebaseAdmin.js";


const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve şifre zorunludur.",
      });
    }

    // OTP oluştur
    const { token } = await otpController.requestOTP(mail);

    // Kullanıcı OTP'sini e-posta ile gönder
    await sendMail(
      mail,
      "Doğrulama Kodu",
      `Kaydolmak için doğrulama kodunuz: ${token}`
    );

    // Kullanıcı kaydını bekleyen duruma al
    await db.collection("pendingUsers").doc(mail).set({
      mail,
      password, // Şifreyi hashlemiyoruz, çünkü kayıt sırasında doğrulama yapılacak
      otp: token, // OTP'yi saklıyoruz
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Kayıt işlemi başlatıldı. OTP kodu e-posta adresinize gönderildi.",

    });
  } catch (error) {
    console.error("Signup hatası:", error);
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

    // Bekleyen kullanıcı kontrolü
    const pendingUserDoc = await db.collection("pendingUsers").doc(mail).get();
    if (!pendingUserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    // Yeni OTP oluştur ve güncelle
    const { token } = await otpController.requestOTP(mail);

    await db.collection("pendingUsers").doc(mail).update({ otp: token });

    // Yeni OTP'yi e-posta ile gönder
    await sendMail(
      mail,
      "Yeni Doğrulama Kodu",
      `Yeni doğrulama kodunuz: ${token}`
    );

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

    // Bekleyen kullanıcıyı kontrol et
    const pendingUserDoc = await db.collection("pendingUsers").doc(mail).get();
    if (!pendingUserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    const pendingUserData = pendingUserDoc.data();

    // OTP doğrulama

    console.log(typeof pendingUserData.otp, pendingUserData.otp);
    console.log(typeof token, token); 
    
    if (pendingUserData.otp !== String(token)) {
      return res.status(400).json({
        success: false,
        message: "OTP kodu geçersiz veya süresi dolmuş.",
      });
    }

    // Şifreyi hashle ve kullanıcıyı kaydet
    const hashedPassword = await argon2.hash(String(pendingUserData.password));

    await db.collection("users").doc(mail).set({
      mail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Bekleyen kullanıcı kaydını sil
    await db.collection("pendingUsers").doc(mail).delete();

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
