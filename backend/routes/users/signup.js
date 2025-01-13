import express from "express";
import { db } from "../../firebaseAdmin.js"; 
const router = express.Router();

router.post("/addUser", async (req, res) => {
  try {
    const { name, age } = req.body;

    const docRef = await db.collection("users").add({
      name,
      age,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      userId: docRef.id, 
    });
  } catch (error) {
    console.error("Firestore ekleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Veri eklenirken hata oluştu.",
      error: error.message,
    });
  }
});

export default router;
