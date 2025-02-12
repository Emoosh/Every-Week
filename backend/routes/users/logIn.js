/* import { auth, db } from "../../Database/firebaseAdmin.js";
import express from "express";
import argon2 from "argon2";
import validator from "validator";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { mail, password } = req.body;

    // Input validation
    if (!mail || !password) {
      return res.status(400).json({
        success: false,
        message: "Tüm alanlar zorunludur.",
      });
    }

    // Email format validation
    if (!validator.isEmail(mail)) {
      return res.status(400).json({
        success: false,
        message: "Geçerli bir e-posta adresi girin.",
      });
    }

    // Check login attempts
    const loginAttemptsRef = db.collection("loginAttempts").doc(mail);
    const loginAttemptsDoc = await loginAttemptsRef.get();
    const loginAttempts = loginAttemptsDoc.exists ? loginAttemptsDoc.data() : { count: 0, lastAttempt: null };

    // Block if too many failed attempts
    if (loginAttempts.count >= 3) {
      const timeSinceLastAttempt = Date.now() - loginAttempts.lastAttempt;
      if (timeSinceLastAttempt < 3 * 60 * 1000) { 
        return res.status(429).json({
          success: false,
          message: "Çok fazla başarısız giriş denemesi. 3 dakika sonra tekrar deneyin."
        });
      }
    }

    // Check if user exists
    const userDoc = await db.collection("users").doc(mail).get();
    if (!userDoc.exists) {
      // Increment failed attempt
      await loginAttemptsRef.set({
        count: (loginAttempts.count || 0) + 1,
        lastAttempt: Date.now()
      });

      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı.",
      });
    }

    // Retrieve user data
    const userData = userDoc.data();

    // Verify password with Argon2
    if (!userData.password) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı şifresi bulunamadı.",
      });
    }
  
    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(userData.password, password);
    if (!isPasswordValid) {
      // Increment failed attempt
      await loginAttemptsRef.set({
        count: (loginAttempts.count || 0) + 1,
        lastAttempt: Date.now()
      });

      return res.status(401).json({
        success: false,
        message: "Geçersiz şifre.",
      });
    }

    // Reset login attempts on successful login
    await loginAttemptsRef.set({ count: 0, lastAttempt: null });

    // Login successful
    await db.collection("users").doc(mail).update({
      lastLogin: new Date()
    });


    return res.status(200).json({
      success: true,
      message: "Giriş başarılı.",
      user: {
        uid: userData.uid,
        name: userData.name,
        email: mail
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

export default router; */