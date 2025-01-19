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
        message: "Tüm alanlar zorunludur.",
      });
    }

    const { token } = await otpController.requestOTP(mail);

    /* await sendMail(
      mail,
      "Doğrulama Kodu",
      `Kaydolmak için kullanacağınız doğrulama kodu: ${token}`
    );
 */
    const isOTPValid = await otpController.verifyOTP(mail, token);

    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "OTP doğrulaması başarısız.",
      });
    }

    const hashedPassword = await argon2.hash(password);

    await db.collection("users").doc(mail).set({
      mail,
      hashedPassword,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Kullanıcı başarıyla kaydedildi.",
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

    const { token } = await otpController.requestOTP(mail);

    return res.status(200).json({
      success: true,
      message: "OTP başarıyla oluşturuldu.",
      testToken: token, 
    });
  } catch (error) {
    console.error("OTP oluşturma hatası:", error);
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

    const isValid = await otpController.verifyOTP(mail, token);

    if (isValid) {
      return res.status(200).json({
        success: true,
        message: "OTP doğrulandı.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "OTP geçersiz veya süresi dolmuş.",
      });
    }
  } catch (error) {
    console.error("OTP doğrulama hatası:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
