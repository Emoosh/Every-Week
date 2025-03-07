import express from "express";
import argon2 from "argon2";
import validator from "validator";
import { connectDB } from "../../Database/db.js"; // MongoDB bağlantısı için
import { generateToken } from "./jwt.js"
;import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({
        success: false,
        message: "Tüm alanlar zorunludur.",
      });
    }

    if (!validator.isEmail(mail)) {
      return res.status(400).json({
        success: false,
        message: "Geçerli bir e-posta adresi girin.",
      });
    }
    const db = await connectDB(); // MongoDB bağlantısını alıyoruz

    // 📌 2. Giriş Denemelerini Kontrol Et (loginAttempts koleksiyonu)
    const loginAttemptsCollection = db.collection("loginAttempts");
    const userCollection = db.collection("users");

    const loginAttempts = await loginAttemptsCollection.findOne({ mail });

    if (loginAttempts && loginAttempts.count >= 3) {
      const timeSinceLastAttempt = Date.now() - loginAttempts.lastAttempt;
      if (timeSinceLastAttempt < 3 * 60 * 1000) {  
        return res.status(429).json({
          success: false,
          message: "Çok fazla başarısız giriş denemesi. 3 dakika sonra tekrar deneyin."
        });
      }
    }

    // 📌 3. Kullanıcı Var mı?
    // İlk olarak e_mail ile ara, bulamazsa mail ile ara
    let user = await userCollection.findOne({ e_mail: mail });
    if (!user) {
      user = await userCollection.findOne({ mail });
    }

    if (!user) {
      // Başarısız giriş denemelerini artır
      await loginAttemptsCollection.updateOne(
        { mail },
        {
          $set: { lastAttempt: Date.now() },
          $inc: { count: 1 }
        },
        { upsert: true } // Eğer kayıt yoksa oluştur
      );

      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    // 📌 4. Şifre Doğrulama (düz metin veya argon2 ile)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı şifresi bulunamadı.",
      });
    }

    // Check if password needs to be verified with argon2 or is plain text
    let isPasswordValid = false;
    
    if (user.password.startsWith('$argon2')) {
      isPasswordValid = await argon2.verify(user.password, password);
    } else {
      isPasswordValid = user.password === password;
    }
    
    if (!isPasswordValid) {
      await loginAttemptsCollection.updateOne(
        { mail },
        {
          $set: { lastAttempt: Date.now() },
          $inc: { count: 1 }
        },
        { upsert: true }
      );

      return res.status(401).json({
        success: false,
        message: "Geçersiz şifre.",
      });
    }

    await loginAttemptsCollection.deleteOne({ mail }); 

    await userCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = generateToken(user); 

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı.",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.e_mail || mail,
        schoolName: user.schoolName,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Giriş sırasında bir hata oluştu.",
      error: error.message
    });
  }
});

export default router;
