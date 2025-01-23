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

    const { token } = await otpController.requestOTP(mail);

    await sendMail(
      mail,
      "Doğrulama Kodu",
      `Kaydolmak için doğrulama kodunuz: ${token}`
    );

    await db.collection("pendingUsers").doc(mail).set({
      mail,
      password, 
      otp: token, 
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "OTP kodu mail adresinize gönderilmiştir. ",

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

    const pendingUserDoc = await db.collection("pendingUsers").doc(mail).get();
    if (!pendingUserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    const { token } = await otpController.requestOTP(mail);

    await db.collection("pendingUsers").doc(mail).update({ otp: String(token) });

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

const MAX_OTP_DURATION = 30;

router.post("/verifyOTP", async (req, res) => {
  try {
    const { mail, token } = req.body;

    if (!mail || !token) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve OTP kodu zorunludur.",
      });
    }

    const pendingUserDoc = await db.collection("pendingUsers").doc(mail).get();
    if (!pendingUserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Bekleyen kullanıcı bulunamadı.",
      });
    }

    //I dont understand why totp doesn't work, I guess it is because I dont have NTP server to
    //sync time but this is also a solution but I don't know if there are any vulnarabilities.
    const pendingUserData = pendingUserDoc.data();
    const createdAt = pendingUserData.createdAt.toDate(); 
    const timeElapsed = Math.floor((Date.now() - createdAt.getTime()) / 1000);
    
    if (timeElapsed > MAX_OTP_DURATION) {
      await db.collection("pendingUsers").doc(mail).delete(); // Kullanıcıyı sil
      return res.status(400).json({
        success: false,
        message: "OTP kodunun süresi dolmuş. Yeni bir kod talep edin.",
      });
    }
    
    if (pendingUserData.otp !== token) {
      return res.status(400).json({
        success: false,
        message: "OTP kodu geçersiz veya süresi dolmuş.",
      });
    }

    const hashedPassword = await argon2.hash(String(pendingUserData.password));

    await db.collection("users").doc(mail).set({
      mail,
      password: hashedPassword,
      createdAt: new Date(),
    });

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
